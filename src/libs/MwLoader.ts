import { global, local, mwItem, globalV, localV } from '../config/default';
import { getFiles, importFile } from '../util/fs'
import { middlewareI, configI, koaI } from '../interface'
import compose = require('koa-compose');
export class MwLoader {
  private global: Array<middlewareI> = []; //全局的中间件 配置
  private local: Array<middlewareI> = [];  // 应用的中间件 配置
  private all: Array<middlewareI> = []; // 所有的中间件 配置
  private enableGMwConfs: Array<middlewareI> = []; // 全局启用的中间件 配置列表
  private enableGMwNames: Array<string> = []; // 启用的全局中间件 名称列表
  private enableLMwConfs: Array<middlewareI> = []; // 业务启用的中间件 配置列表
  private allMws: Map<string, middlewareI> = new Map(); // 所有的 中间件实例 中央库
  private mws: Map<string, middlewareI> = new Map(); // 所有启用状态 中间件实例 中央库 
  private enableGMws: Map<string, middlewareI> = new Map(); // 启用状态的全局中间件实例 映射池
  private mwDir: string;

  /**
   * 中间件加载模块 处理中间件 
   * @param confFile  中间件配置文件  middleware.js
   * @param mwDir 所有中间件的存放目录
   */
  constructor(confFile: string, mwDir: string) {
    this.loadCong(confFile); // 处理config文件
    this.mwDir = mwDir;
  }
  /**
   * 根据配置文件 收集中间件实例
   * @param confFile 
   */
  private async loadCong(confFile: string) {
    const conf = await importFile(confFile);
    conf && this.setConf(conf as configI);
    this.gatherEnableGMws();
    this.gatherAll();
    this.gatherAllMws();
  }
  /**
   * 处理 配置文件
   * @param conf 
   */
  private setConf(conf: configI) {
    conf.global && this.setGlobal(conf.global);
    conf.local && this.setLocal(conf.local);
    this.setEnableGlobal(
      this.getGlobal().filter(m => {
        return m.enable;
    }));
    this.setEnableGMwNames(
      this.enableGMwConfs.map(m => {
        return m.name;
      })
    );
    this.setEnableLocal(
      this.getGlobal().filter(m => {
        return !m.enable;
    }));
  }
  
  /**
   * 收集所有中间件配置 列表
   */
  private gatherAll() {
    this.all = this.getGlobal().map(mw => {
      return { ...mwItem, ...mw, type: globalV };
    })
    .concat(
      this.getLocal().map(mw => {
        return { ...mwItem, ...mw, type: localV };
      })
    );
  }
  /**
   * 收集启用状态的全局中间件 入库
   */
  private gatherEnableGMws() {
    const enableGMws = this.enableGMws,
      mwDir = this.mwDir,
      enableGMwConfs = this.enableGMwConfs;
    let instance = null;
    enableGMws.clear();
    enableGMwConfs.forEach(async m => {
      instance = await importFile(m.package || (mwDir + m.name));
      if (!enableGMws.has(m.name)) {
        //收集所有的中间件实例 确定映射关系 存入中央库备用
        enableGMws.set(m.name, {...m, instance}); 
      } else {
        console.error(`全局中间件${m.name}重复定义`);
      }
    })
  }
  /**
   * 收集 所有中间件实例 => 中央库
   */
  private async gatherAllMws() {
    const all = this.all,
      allMws = this.allMws,
      mws = this.mws,
      mwDir = this.mwDir;
    let instance = null;
    allMws.clear();
    mws.clear();
    all.length && all.forEach(async m => {
      instance = await importFile(m.package || (mwDir + m.name));
      if (!allMws.has(m.name)) {
        //收集所有的中间件实例 确定映射关系 存入中央库备用
        allMws.set(m.name, {...m, instance}); 
      } else {
        console.error(`中间件${m.name}重复定义`);
      }
      if (m.enable && !mws.has(m.name)) {
        //收集启用状态的的中间件实例 确定映射关系 存入有效中央库备用
        mws.set(m.name, {...m, instance});
      }
    });
  }
  private getEnableGMws() {
    return this.enableGMws;
  }
  private setGlobal(mws: Array<middlewareI> = global) {
    this.global = mws;
  }
  private setLocal(mws: Array<middlewareI> = local) {
    this.local = mws;
  }
  private setEnableGlobal(mws: Array<middlewareI>) {
    this.enableGMwConfs = mws;
  }
  private setEnableLocal(mws: Array<middlewareI>) {
    this.enableLMwConfs = mws;
  }
  private setEnableGMwNames(gMwNames: Array<string>) {
    this.enableGMwNames = gMwNames;
  }
  private getEnableGMwNames() {
    return this.enableGMwNames;
  }
  private getGlobal() {
    return this.global;
  }
  private getLocal() {
    return this.local;
  }
  private getMws() {
    return this.mws;
  }
  /**
   * 对外暴露API：加载传入的应用程序的中间件  + loader会默认加载全局中间件，调用方只需要传入业务的中间件列表即可
   * mwLoaderInstance.use(app, mws)
   * @param app: koa实例
   * @param mws: 业务中间件名称 | 列表  
   */
  use(app: koaI, localMws: string | Array<string>) {
    if (typeof localMws === 'string') {
      localMws = [localMws];
    }
    const mws = this.getMws(); // 启用状态的中间件库
    const gMws = this.getEnableGMws(); // 启用状态的全局中间件池
    const globalMws = this.getEnableGMwNames();
    const mwList = new Array();
    let instance = null;
    globalMws.concat(localMws).forEach(name => { //应用的所有中间件 = 启用的全局中间件 + 传入的业务中间件 
      if (mws.has(name)) { // 过滤禁用的中间件
        instance = mws.get(name);
        instance && mwList.push(new instance.instance(instance.options)); //将中间件函数对象存入集合
      };
    });
    app.use(compose(mwList)); //应用的中间件流-队列
  }
}