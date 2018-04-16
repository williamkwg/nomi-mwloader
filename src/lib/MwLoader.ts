import { global, local } from '../config/default';
export class MwLoader {
  private global: Array<object> = [];
  private local: Array<object> = []; 

  /**
   * 中间件加载模块 处理中间件 
   * @param confFile  中间件配置文件  middleware.js
   * @param mwDir 所有中间件的存放目录
   */
  constructor(confFile: string, mwDir: string) {
    this.loadCong(confFile);
    this.loadMws(mwDir);
  }
  private loadCong(confFile: string) {
    const conf = require(confFile);
    this.global = conf && conf.global || global;
    this.local = conf && conf.local || conf;
  }
  private loadMws(mwDir: string) {
    
  }
  getGlobal() {
    return this.global;
  }
  getLocal() {
    return this.local;
  }
  use() {

  }
} 