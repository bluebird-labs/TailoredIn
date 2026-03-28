import 'dotenv/config';
import * as NpmLog from 'npmlog';
import { server }  from './server.js';

const port = process.env.PORT || 8000;

server.listen(port, () => {
  NpmLog.info('Server', `Listening on port ${port}...`);
});
