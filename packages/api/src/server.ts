import * as http from 'node:http';
import { app } from './app.js';

const server = http.createServer(app.callback());

export { server };
