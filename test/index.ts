import { MwLoader } from '../src/lib/MwLoader';
import koa = require('koa');
const app = new koa();
const mwl = new MwLoader(process.cwd() + '/dist/test/config/middleware', process.cwd() + '/dist/test/middleware');
mwl.use(app, ['localA']);
app.listen(3000);