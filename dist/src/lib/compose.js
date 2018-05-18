"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = (middleware) => {
    return (context, cb = (() => { })) => {
        // use index to calculate the number of what the middleware exec next function
        let index = -1;
        const dispatch = (i) => {
            if (i <= index) {
                return Promise.reject(new Error('next() called multiple times'));
            }
            index = i;
            let fn = middleware[i];
            // when all the middleware has been called,  to exec next() as to callback()
            if (i === middleware.length) {
                fn = cb;
            }
            try {
                return Promise.resolve(fn(context, () => {
                    return dispatch(i + 1); // exec next function procedure
                }));
            }
            catch (err) {
                return Promise.reject(err);
            }
        };
        return dispatch(0); // entry
    };
};
