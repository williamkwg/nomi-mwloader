export default class localA {
  constructor(options: object) {
    return async (ctx: object, next: Function) => {
      console.log('local A');
      next();
    }
  }
};
