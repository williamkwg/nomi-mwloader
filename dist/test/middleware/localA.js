"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class localA {
    constructor(options) {
        return async (ctx, next) => {
            console.log('local A into');
            next();
            console.log('local A back');
        };
    }
}
exports.default = localA;
;
