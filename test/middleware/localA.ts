export default class localA {
  constructor(options: object) {
    return async (ctx: object, next: Function) => {
      console.log('local A into');
      next();
      console.log('local A back');
    }
  }
};
