// Force server timezone to KST (Asia/Seoul) for consistent timestamp handling.
process.env.TZ = 'Asia/Seoul';

import { config } from './config';
import { createApp } from './app';

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${config.port} (TZ=${process.env.TZ})`);
});
