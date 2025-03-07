import { AxiosResponse, InternalAxiosRequestConfig, MessagingService } from "@gepick/core/common"
import { message } from "ant-design-vue"

export class BrowserMessagingService extends MessagingService {
  constructor() {
    super({ baseURL: process.env.MESSAGING_URL ?? '/api' });
  }

  override onBeforeRequestSend(config: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
    config = this.setTokenToConfig(config);

    return config;
  }

  override onResponseReceived(response: AxiosResponse<{ code: number, data: any, message: string }, any>) {
    if (response.data.data.code && (response.data.data.code < 200 || response.data.data.code >= 300)) {
      this.handleGeneralError(response.data.data.code, response.data.data.message);
    }

    /**
     * interface AxiosResponse<T = any, D = any> {
     *   data: T;
     *   status: number;
     *   statusText: string;
     *   headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
     *   config: InternalAxiosRequestConfig<D>;
     *   request?: any;
     * }
     */
    return response.data;
  }

  override onResponseError(errStatus?: number): void {
    enum ErrorStatus {
      BadRequest = 400,
      Unauthorized = 401,
      Forbidden = 403,
      NotFound = 404,
      MethodNotAllowed = 405,
      RequestTimeout = 408,
      InternalServerError = 500,
      NotImplemented = 501,
      BadGateway = 502,
      ServiceUnavailable = 503,
      GatewayTimeout = 504,
      HTTPVersionNotSupported = 505,
    }
    const ErrorStatusMap = new Map<ErrorStatus, string>([
      [ErrorStatus.BadRequest, "Bad Request"],
      [ErrorStatus.Unauthorized, "ログイン後にご利用ください。"],
      [ErrorStatus.Forbidden, "Forbidden"],
      [ErrorStatus.NotFound, "Not Found"],
      [ErrorStatus.MethodNotAllowed, "Method Not Allowed"],
      [ErrorStatus.RequestTimeout, "Request Timeout"],
      [ErrorStatus.InternalServerError, "Internal Server Error"],
      [ErrorStatus.NotImplemented, "Not Implemented"],
      [ErrorStatus.BadGateway, "Bad Gateway"],
      [ErrorStatus.ServiceUnavailable, "Service Unavailable"],
      [ErrorStatus.GatewayTimeout, "Gateway Timeout"],
      [ErrorStatus.HTTPVersionNotSupported, "HTTP Version Not Supported"],
    ]);

    if (errStatus) {
      const errorMessage = ErrorStatusMap.get(errStatus as ErrorStatus) || "Unknown Error";

      message.error(errorMessage);
    }
  }

  private setTokenToConfig(config: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
    const token = window.localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${window.localStorage.getItem('token')}`;
    }

    return config;
  }

  private handleGeneralError(errno: number, errmsg: string) {
    switch (errno) {
      case 401: {
        message.error("token已失效请重新登录")
        localStorage.removeItem("token")
        break;
      }

      default: {
        if (errno && errmsg) {
          message.error(errmsg);
        }
      }
    }
  }
}

export const messagingService = new BrowserMessagingService();
