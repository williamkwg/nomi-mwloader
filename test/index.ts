import { MwLoader } from '../src/lib/MwLoader';
import koa = require('koa');
const app = new koa();
const mwl = new MwLoader(process.cwd() + '/dist/test/config/middleware', process.cwd() + '/dist/test/middleware');
const match = async (ctx:Object, next?: Function) => {
  mwl.use(ctx, ['localA'], () => {
    console.log('controller.action run');
  });
  next && next();
}
app.use(match);
mwl.use(app, ['localA']);
app.listen(3333);