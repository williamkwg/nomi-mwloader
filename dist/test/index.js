"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MwLoader_1 = require("../src/lib/MwLoader");
const koa = require("koa");
const app = new koa();
const mwl = new MwLoader_1.MwLoader(process.cwd() + '/dist/test/config/middleware', process.cwd() + '/dist/test/middleware');
mwl.use(app, ['localA']);
app.listen(3333);
