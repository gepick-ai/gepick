import { Buffer } from 'node:buffer';
import { Server as HttpServer, createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { bottender } from "bottender";
import BottenderServer from 'bottender/dist/server/Server';
import chalk from 'chalk';
import mongoose from 'mongoose';

import { createJwtGuard, useAuthRouter, useOauthRouter } from "@gepick/auth/node"
import { useUserRouter } from "@gepick/user/node"
import { MessagingContribution } from "@gepick/messaging/node"
import { pluginDeploymentContribution, pluginServerConnectionHandler } from "@gepick/plugin-system/node"

import { OAUTH_CALLBACK_API, OAUTH_PREFILIGHT_API, SEND_EMAIL_CAPTCHA_API, VERIFY_EMAIL_CAPTCHA_API } from "@gepick/auth/common"
import { useCopilotRouter } from '@gepick/copilot/node';

export class GepickServer {
  private bottenderServer: BottenderServer = bottender({
    dev: process.env.NODE_ENV !== "production",
  });

  private expressServer: Application = express();
  private httpServer: HttpServer = createServer(this.expressServer);
  private apiRouter = express.Router();

  constructor() {
    this.useBodyParser(this.expressServer);
    this.useCors(this.expressServer);
    this.useResponseFormatter(this.expressServer);
    this.useErrorHandler(this.expressServer);
    this.useAuthGuard(this.expressServer);
    this.useRoutes();
    this.use404Handler(this.expressServer);
    this.useBottender(this.expressServer);
    this.connectToDatabase(() => {
      // eslint-disable-next-line no-console
      console.log(chalk.green.bold('✔ Connected to Gepick MongoDB'));
    })
  }

  async start() {
    const { promise, resolve } = Promise.withResolvers()
    await this.bottenderServer.prepare();
    const port = 3000;

    this.httpServer.listen(port, () => {
      const address = this.httpServer.address() as AddressInfo;
      const host = address.address === '::' ? 'localhost' : address.address;
      const port = address.port;

      pluginDeploymentContribution.initialize();

      const messagingContribution = new MessagingContribution();
      messagingContribution.addHandler(pluginServerConnectionHandler);
      messagingContribution.onStart(this.httpServer);
      resolve({ host, port })
    });

    return promise
  }

  // 使用 body-parser，作用是解析请求体
  private useBodyParser(app: Application): void {
    const verify = (req: express.Request, _: express.Response, buf: Buffer): void => {
      (req as any).rawBody = buf.toString();
    };

    app.use(bodyParser.json({ verify }));
    app.use(bodyParser.urlencoded({ extended: false, verify }));
  }

  // 使用 cors，作用是解决跨域问题
  private useCors(app: Application): void {
    app.use(cors({ credentials: true, origin: true }));
  }

  // 格式化响应， 作用是统一响应格式
  private useResponseFormatter(app: Application): void {
    app.use((_req, res, next) => {
      const internalJson = res.json;

      res.json = function (data: any) {
        const formattedResponse = {
          code: res.statusCode,
          message: res.statusMessage || 'Success',
          data,
        };
        return internalJson.call(this, formattedResponse);
      };

      next();
    });
  }

  private use404Handler(app: Application) {
    // 处理所有未匹配的路由
    app.use((req: Request, res: Response) => {
      res.json({
        success: false,
        error: {
          code: 404,
          message: `Cannot ${req.method} ${req.path}`,
        },
      });
    });
  }

  // 处理错误响应，作用是统一错误处理
  private useErrorHandler(app: Application): void {
    interface Error {
      status?: number
      message?: string
      stack?: string
    }

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err.stack);

      res.status(err.status || 500).json({
        code: err.status || 500,
        message: err.message || 'Internal Server Error',
        data: null,
      });
    });
  }

  private useAuthGuard(app: Application) {
    const API_PREFIX = '/api';

    app.use(API_PREFIX, (req, res, next) => {
      const handleErrorNext = (err) => {
        if (err) {
          if (
            err.name === 'UnauthorizedError'
            && err.inner.name === 'TokenExpiredError'
          ) {
            res.json({
              code: 401,
              message: "jwt expired",
            })
            return
          }
        }
        next(err);
      };
      const middleware = createJwtGuard([
        OAUTH_PREFILIGHT_API,
        OAUTH_CALLBACK_API,
        SEND_EMAIL_CAPTCHA_API,
        VERIFY_EMAIL_CAPTCHA_API,
      ], API_PREFIX)

      middleware(req, res, handleErrorNext);
    }, this.apiRouter)
  }

  // 使用 api router，作用是将所有 api 请求路由到 apiRouter
  private useRoutes() {
    useOauthRouter(this.apiRouter)
    useAuthRouter(this.apiRouter)
    useUserRouter(this.apiRouter)
    useCopilotRouter(this.apiRouter)
  }

  private useBottender(app: Application): void {
    const handle = this.bottenderServer.getRequestHandler();
    app.all("*", (req, res) => {
      return handle(req, res);
    });
  }

  private async connectToDatabase(log: () => void): Promise<void> {
    await mongoose.connect(process.env.DATABASE_URL ?? 'mongodb://localhost:27017/gepick');
    log()
  }
}

async function main() {
  try {
    const server = new GepickServer();

    server.start()
      .then(({ host, port }: any) => {
        // eslint-disable-next-line no-console
        console.log(chalk.green.bold(`✔ Gepick Server is running at http://${host}:${port}`));
      });
  }
  catch (err) {
    console.error((err as Error).stack);
  }
}

main()
