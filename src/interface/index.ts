export interface middlewareI  {
  name: string,
  package ?: string,
  enable: boolean | Function, // 是否启用
  match?: RegExp, // 符合正则的request 会流经该中间件  
  options?: object,
  type?: string
};
export interface configI {
  global: Array<any>,
  local: Array<any>
}