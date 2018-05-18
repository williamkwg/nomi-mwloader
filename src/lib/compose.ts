
export const compose = (middleware: Array<Function>): Function => {
  return (context:Object, cb:Function = (()=>{})): Promise<any> => {
    // use index to calculate the number of what the middleware exec next function
    let index = -1; 
    const dispatch = (i:number): Promise<any> => { 
      if (i <= index){ // to prevent the next function called multiple times
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
          return dispatch(i + 1);  // exec next function procedure
        }));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0); // entry
  }
}

