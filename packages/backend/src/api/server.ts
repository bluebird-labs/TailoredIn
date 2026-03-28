import * as http from 'node:http';
import { app } from './app';

const server = http.createServer(app.callback());

export { server };
