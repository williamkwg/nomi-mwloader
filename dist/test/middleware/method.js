"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class method {
    constructor(options) {
        return async (ctx, next) => {
            console.log(`请求${ctx}...`);
            next();
        };
    }
}
exports.default = method;
;
