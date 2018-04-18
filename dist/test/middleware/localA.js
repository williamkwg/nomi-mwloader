"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class localA {
    constructor(options) {
        return async (ctx, next) => {
            console.log('local A');
            next();
        };
    }
}
exports.default = localA;
;
