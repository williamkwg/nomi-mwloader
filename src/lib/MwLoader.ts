import { join } from 'path';
export class MwLoader {
  private global: Array<object> = [];
  private local: Array<object> = []; 

  /**
   * 中间件加载木块 处理 框架内置中间件， 
   * @param global 
   * @param local 
   */
  constructor(global: Array<object> = [], local: Array<object> = []) {
    this.global = global;
    this.local = local;
  }
  getGlobal() {
    return this.global;
  }
  getLocal() {
    return this.local;
  }

} 