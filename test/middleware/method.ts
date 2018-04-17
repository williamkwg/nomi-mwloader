export default class method {
  constructor(options) {
    return async (ctx, next) => {
      console.log(`请求${ctx.url}的方法的${ctx.method}`);
      next();
    }
  }
};
