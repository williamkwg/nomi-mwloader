import { global, local } from '../config/default';
import { getFiles, importFile } from '../util/fs'
import { middlewareI } from '../interface'
//import { Promise } from 'es6-promise';
export class MwLoader {
  private global: Array<middlewareI> = [];
  private local: Array<middlewareI> = [];
  private enableGMws: Array<middlewareI> = []; // 全局启用的中间件列表
  private enableLMws: Array<middlewareI> = []; // 业务启用的中间件列表
  private allMws: Array<any> = []; // 中间件实例 中央库 (所有的：包含禁用的)
  private mws: Array<any> = []; // 有效的  中间件实例 中央库 (只包含启用状态的)
  private globals: Array<any> = []; // 有效的 全局 中间件实例 仓库
  private locals: Array<any> = [];  // 有销的 应用 中间件实例 仓库

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
    conf && this.setGlobal(conf.global);
    conf && this.setLocal(conf.local);
    this.setEnableGlobal(this.getGlobal().filter(m => {
      return m.enable;
    }));
    this.setEnableLocal(this.getGlobal().filter(m => {
      return !m.enable;
    }));
  }
  private setGlobal(mws: Array<middlewareI> = global) {
    this.global = mws;
  }
  private setLocal(mws: Array<middlewareI> = local) {
    this.local = mws;
  }
  private async loadMws(mwDir: string) {
    const mws = getFiles(mwDir);
    const result = await mws.map(async file => {
      try {
        return await importFile(file);
      } catch( err ) {
        console.log(`load middlewares error`);
      }
    });
    return result;
    /*
    Promise.all(mws.map(file => {
      return import(file);
    })).then(result => {
       return result.map(f => {return f.default});
    }).catch(err => {
      console.info(`load middlewares error`)
    });*/
  }
  private setEnableGlobal(mws: Array<middlewareI>) {
    this.enableGMws = mws;
  }
  private setEnableLocal(mws: Array<middlewareI>) {
    this.enableLMws = mws;
  }
  private getGlobal() {
    return this.global;
  }
  private getLocal() {
    return this.local;
  }
  /**
   * 获取有效的全局中间件配置
   */
  getGlobalConf() {
    return this.enableGMws;
  }
  /**
   * 获取有效的应用中间件配置
   */
  getLocalConf() {
    return this.enableLMws;
  }
  /**
   * 获取有效的全局中间件实例
   */
  getGlobals() {
    return 
  }
  /**
   * 获取有效的应用中间件实例
   */
  getLocals() {
    return 
  }
  /**
   * 获取所有中间件实例
   */
  getMws() {

  }
} 