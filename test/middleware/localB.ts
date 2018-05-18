export default class localB {
  constructor(options: object) {
    return async (ctx: object, next: Function) => {
      console.log('local B into');
      next();
      console.log('local B back');
    }
  }
};
