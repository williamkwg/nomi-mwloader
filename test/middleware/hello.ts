export default class hello {
  constructor(options) {
    return async (ctx, next) => {
      console.log('Hello World');
      next();
    }
  }
};
