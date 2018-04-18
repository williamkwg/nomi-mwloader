"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class hello {
    constructor(options) {
        return async (ctx, next) => {
            console.log('Hello World');
            next();
        };
    }
}
exports.default = hello;
;
