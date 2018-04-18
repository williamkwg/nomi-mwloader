export interface middlewareI  {
  name: string,
  package ?: string,
  enable: boolean | Function, // 是否启用
  match?: RegExp, // 符合正则的request 会流经该中间件  
  options?: object,
  type?: string,
  instance?: any
};
export interface configI {
  global: Array<any>,
  local: Array<any>
}

export interface koaI {
  listen: Function,
  use: Function
}

export interface Map<K, V> {
  clear(): void;
  delete(key: K): boolean;
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): this;
  readonly size: number;
}