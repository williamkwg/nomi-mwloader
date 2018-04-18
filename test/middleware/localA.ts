export default class localA {
  constructor(options) {
    return async (ctx, next) => {
      console.log('local A');
      next();
    }
  }
};
