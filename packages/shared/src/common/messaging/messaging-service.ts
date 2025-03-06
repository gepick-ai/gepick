import axios, { AxiosDefaults, AxiosResponse, InternalAxiosRequestConfig, RawAxiosRequestHeaders } from "axios"
import { merge } from 'lodash-es'

export interface IHttpResponseBody<T> {
  errno: string
  errmsg: string
  data: T
}

export type IMessagingResponse<T> = [any, T | undefined]

interface IMessagingService {
  /**
   * 当请求准备被发出前触发
   *
   * 用途：设置请求头、请求参数等。
   */
  onBeforeRequestSend: (config: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any>
  /**
   * 当响应数据被接收后触发
   *
   * 用途：处理响应数据、处理业务错误码、处理通用错误码等。即响应状态码是200范围的，但是业务状态码有问题的情况。
   */
  onResponseReceived: (response: AxiosResponse<any, any>) => AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>
  /**
   * 当响应错误时触发
   *
   * 用途：处理通用错误码，如400、401、403、404、405、408、500、501、502、503、504、505等。
   */
  onResponseError: (errStatus?: number) => void

  /**
   * 发送POST请求
   * @param url   请求地址
   * @param params  请求参数（body参数）
   * @returns Promise<IMessagingResponse<T>>  返回一个Promise对象，包含错误和响应数据
   */
  post: <T = unknown>(url: string, params: Record<string, any>, headers?: RawAxiosRequestHeaders) => Promise<IMessagingResponse<T>>

  /**
   *  发送GET请求
   * @param url   请求地址
   * @param params  请求参数（query查询参数）
   * @returns Promise<IMessagingResponse<T>>  返回一个Promise对象，包含错误和响应数据
   */
  get: <T = unknown>(url: string, params: Record<string, any>) => Promise<IMessagingResponse<T>>
}

export abstract class MessagingService implements IMessagingService {
  constructor(public readonly defaultConfig: Omit<AxiosDefaults, 'headers'>) {
    // 设置axios默认配置
    merge(axios.defaults, defaultConfig, { timeout: 120000 })

    // 设置axios网络请求拦截器，参见https://axios-http.com/docs/interceptors
    this.useRequestInterceptors()
    this.useResponseInterceptors()
  }

  post<T = unknown, U extends Record<string, any> = Record<string, any>>(url: string, params?: U, headers?: RawAxiosRequestHeaders): Promise<IMessagingResponse<T>> {
    const { promise, resolve } = Promise.withResolvers<IMessagingResponse<T>>();

    enum ParamType {
      FormData = 'application/x-www-form-urlencoded',
      JSON = 'application/json',
    }

    axios({
      method: "post",
      url,
      data: headers?.['Content-Type'] === ParamType.FormData ? new URLSearchParams(params) : params,
      headers,
    }).then((result) => {
      resolve([null, result.data]);
    }).catch((err) => {
      resolve([err, undefined]);
    });

    return promise;
  }

  get<T = unknown, U extends Record<string, any> = Record<string, any>>(url: string, params?: U): Promise<IMessagingResponse<T>> {
    const { promise, resolve } = Promise.withResolvers<IMessagingResponse<T>>();

    axios({
      method: "get",
      url,
      params,
    }).then((result) => {
      resolve([null, result.data]);
    }).catch((err) => {
      resolve([err, undefined]);
    });

    return promise
  }

  private useRequestInterceptors() {
    axios.interceptors.request.use((config) => {
      return this.onBeforeRequestSend(config);
    })
  }

  private useResponseInterceptors() {
    axios.interceptors.response.use((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.data);
      }

      return this.onResponseReceived(response);
    }, (err) => {
      if (err.response && err.response.status) {
        this.onResponseError(err.response.status)
      }

      return Promise.reject(err.repsonse)
    })
  }

  onBeforeRequestSend(config: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
    return config;
  }

  /**
   *
   * HTTP响应收到时触发
   *
   * ```ts
   * interface AxiosResponse<T = any, D = any> {
   *   data: T;
   *   status: number;
   *   statusText: string;
   *   headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
   *   config: InternalAxiosRequestConfig<D>;
   *   request?: any;
   * }
   * ```
   *
   * axios的response对应的是http报文，在response里头的data才是我们自定义的业务数据结构，它代表http response的响应体body。
   * 一般来说，我们的业务数据结构是这样的：
   *
   * ```ts
   * interface IBusinessResponse<T> {
   *    code: string,
   *    message: string,
   *    data: T
   * }
   * ```
   */
  onResponseReceived(response: AxiosResponse<any, any>): any {
    return response;
  }

  abstract onResponseError(errStatus?: number): void;
}

export type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export enum ContentType {
  Json = 'application/json',
  UrlEncoded = 'application/x-www-form-urlencoded',
  FormData = 'multipart/form-data',
  PlainText = 'text/plain',
  Html = 'text/html',
  Xml = 'application/xml',
  Stream = 'application/octet-stream',
}
