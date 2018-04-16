export default options => {
  return async (ctx, next) => {
    console.log('Hello World');
    next();
  };
};