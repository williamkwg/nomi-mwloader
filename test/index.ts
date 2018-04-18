import { MwLoader } from '../src/libs/MwLoader';
import koa = require('koa');
const app = new koa();
const mwl = new MwLoader('./config/middleware', './middleware');
mwl.use(app, ['localA']);
app.listen(3000);