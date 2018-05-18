"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class localB {
    constructor(options) {
        return async (ctx, next) => {
            console.log('local B into');
            next();
            console.log('local B back');
        };
    }
}
exports.default = localB;
;
