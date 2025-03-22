/* eslint-disable ts/no-namespace */

import { URI } from "@gepick/core/common";

/**
 * An endpoint provides URLs for http and ws, based on configuration ansd defaults.
 */
export class Endpoint {
  constructor(protected options: Endpoint.Options = {}) {
  }

  getWebSocketUrl(): URI {
    return new URI(`${this.wsScheme}://${this.host}${this.path}`)
  }

  getRestUrl(): URI {
    return new URI(`${this.httpScheme}://${this.host}${this.path}`)
  }

  protected get host() {
    return `localhost:5173`
    // if (location.host) {
    //   return location.host;
    // }
    // return `localhost:${this.port}`;
  }

  protected get port(): string {
    return this.getSearchParam('port', '5173');
  }

  protected getSearchParam(name: string, defaultValue: string): string {
    const search = location.search;
    if (!search) {
      return defaultValue;
    }
    return search.substr(1).split('&')
      .filter(value => value.startsWith(`${name}=`))
      .map((value) => {
        const encoded = value.substr(name.length + 1);
        return decodeURIComponent(encoded)
      })[0] || defaultValue;
  }

  protected get wsScheme() {
    return this.httpScheme === 'https:' ? 'wss' : 'ws';
  }

  protected get httpScheme() {
    if (this.options.httpScheme) {
      return this.options.httpScheme
    }
    if (location.protocol === 'http' || location.protocol === 'https') {
      return location.protocol
    }
    return 'http'
  }

  protected get path() {
    if (this.options.path) {
      if (this.options.path.startsWith("/")) {
        return this.options.path
      }
      else {
        return `/${this.options.path}`
      }
    }
    return this.options.path || ""
  }
}

export namespace Endpoint {
  export class Options {
    host?: string
    wsScheme?: string
    httpScheme?: string
    path?: string
  }
}
