export default class method {
  constructor(options: object) {
    return async (ctx: object, next: Function) => {
      console.log(`请求${ctx}...`);
      next();
    }
  }
};
