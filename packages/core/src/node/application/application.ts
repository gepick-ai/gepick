import * as http from 'node:http';

export interface IApplicationContribution {
  onStart: (server: http.Server) => void
}

export class Application {
  
}
