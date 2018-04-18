export default class hello {
  constructor(options: object) {
    return async (ctx: object, next: Function) => {
      console.log('Hello World');
      next();
    }
  }
};
