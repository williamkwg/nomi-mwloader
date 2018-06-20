import MwLoader from '../src/lib/MwLoader';
const koa = require('koa');
const app = new koa();
const mwl = new MwLoader(process.cwd() + '/dist/test/config/middleware', '/dist/test/middleware');
const match = async (ctx:Object, next?: Function) => {
  mwl.use(ctx, ['localA'], () => {
    console.log('controller.action run');
  });
  next && next();
}
app.use(match);
app.listen(1111);