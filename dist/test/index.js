"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MwLoader_1 = require("../src/lib/MwLoader");
const koa = require("koa");
const app = new koa();
const mwl = new MwLoader_1.MwLoader(process.cwd() + '/dist/test/config/middleware', '/dist/test/middleware');
const match = async (ctx, next) => {
    mwl.use(ctx, ['localA'], () => {
        console.log('controller.action run');
    });
    next && next();
};
app.use(match);
app.listen(1111);
