import { server } from './server';
import * as NpmLog from 'npmlog';

const port = process.env.PORT || 8000;

server.listen(port, () => {
  NpmLog.info('Server', `Listening on port ${port}...`);
});
