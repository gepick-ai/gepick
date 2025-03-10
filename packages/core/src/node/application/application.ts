import { Buffer } from 'node:buffer';
import { Server as HttpServer, createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import express, { Application as ExpressApp, NextFunction, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chalk from 'chalk';
import mongoose from 'mongoose';
import { IContributionProvider, InjectableService, PostConstruct } from '@gepick/core/common';
import { IApplicationContribution, IApplicationContributionProvider } from './application-contribution';

export class Application extends InjectableService {
  private expressApp: ExpressApp = express();
  private expressRouter = express.Router();
  private server: HttpServer = createServer(this.expressApp);

  constructor(
    @IApplicationContributionProvider private readonly contributionProvider: IContributionProvider<IApplicationContribution>,
  ) {
    super()

    this.useBodyParser()
    this.useCors()
    this.useResponseFormatter()
    this.useErrorHandler()

    for (const contribution of this.contributionProvider.getContributions()) {
      contribution.onApplicationInit?.(this.expressRouter, this.expressApp)
    }
  }

  @PostConstruct()
  configure() {
    for (const contribution of this.contributionProvider.getContributions()) {
      contribution.onApplicationConfigure?.(this.expressRouter)
    }

    this.use404Handler()
  }

  async start() {
    await this.connectToDatabase(() => {
      // eslint-disable-next-line no-console
      console.log(chalk.green.bold('✔ Connected to Gepick MongoDB'))
    })

    const port = 3000;

    this.server.listen(port, () => {
      const address = this.server.address() as AddressInfo;
      const host = address.address === '::' ? 'localhost' : address.address;
      const port = address.port;

      // eslint-disable-next-line no-console
      console.log(chalk.green.bold(`✔ Gepick Server is running at http://${host}:${port}`));

      for (const contribution of this.contributionProvider.getContributions()) {
        contribution.onApplicationStart?.(this.server)
      }
    });
  }

  // 使用 body-parser，作用是解析请求体
  private useBodyParser(): void {
    const verify = (req: express.Request, _: express.Response, buf: Buffer): void => {
      (req as any).rawBody = buf.toString();
    };

    this.expressApp.use(bodyParser.json({ verify }));
    this.expressApp.use(bodyParser.urlencoded({ extended: false, verify }));
  }

  // 使用 cors，作用是解决跨域问题
  private useCors(): void {
    this.expressApp.use(cors({ credentials: true, origin: true }));
  }

  // 格式化响应， 作用是统一响应格式
  private useResponseFormatter(): void {
    this.expressApp.use((_req, res, next) => {
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

  // 处理错误响应，作用是统一错误处理
  private useErrorHandler(): void {
    interface Error {
      status?: number
      message?: string
      stack?: string
    }

    this.expressApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err.stack);

      res.status(err.status || 500).json({
        code: err.status || 500,
        message: err.message || 'Internal Server Error',
        data: null,
      });
    });
  }

  private use404Handler() {
    // 处理所有未匹配的路由
    this.expressApp.use((req: Request, res: Response) => {
      res.json({
        success: false,
        error: {
          code: 404,
          message: `Cannot ${req.method} ${req.path}`,
        },
      });
    });
  }

  private async connectToDatabase(log: () => void): Promise<void> {
    await mongoose.connect(process.env.DATABASE_URL ?? 'mongodb://localhost:27017/gepick');
    log()
  }
}

export const IApplication = Application.getServiceId()
export type IApplication = Application
