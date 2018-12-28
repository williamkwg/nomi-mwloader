
import { global, local, mwItem, globalV, localV } from '../config/default';
import { getFiles, importFile, create } from '../util/fs'
import { middlewareI, configI, Map } from '../interface'
import { join } from 'path';
import { compose } from './compose';

export default class MwLoader {
  private global: Array<middlewareI> = []; // the configuration collection of all global middleware 
  private local: Array<middlewareI> = [];  // the configuration collection of all local middleware
  private enableGMwConfs: Array<middlewareI> = []; // the configuration collection of the all enabled global middleware
  private enableLMwConfs: Array<middlewareI> = []; // the configuration collection of the all enabled local middleware
  private enableLocalMws: Map<string, middlewareI> = new Map(); // the map warehouse of all enabled local middleware instance
  private enableGMws: Map<string, middlewareI> = new Map(); // the map warehouse of all enabled global middleware instance
  private enableGMwList: Array<any> = []; // the collection of all enbaled global middleware instance
  private localMwCache: Map<string, middlewareI> = new Map(); // the cache map of the executed local middleware
  private mwDir: string; // the storeage directory of all middlewares
  private configuration: string | configI; // the path of configuration file

  /**
   * middleware loader module
   * @param confFile  the path of configuration file: save the middleware configuration information 
   * @param mwDir the storage directory of all middlewares
   */
  constructor(confFile: string | configI, mwDir: string) {
    this.configuration = confFile;
    this.mwDir = mwDir;
  }
  /**
   * according to the configuration file, cache middleware configuration  and gather middleware instances to map  warehourse
   * @param confFile 
   */
  private async run() {
    let config = {};
    console.log(`middleware loader module read config file success`);
    if (typeof this.configuration === 'string') {
      config = await importFile(this.configuration); // import the configuration file of all middleware 
    } else {
      config = this.configuration;
    }
    config && this.setConf(config as configI); // cache configuration
    await this.gatherEnableGMws(); //  gather all of the enabled global middleware
    await this.gatherEnableLMws(); // cache all middleware instance 
  }
  /**
   * read configuration file
   * @param conf 
   */
  private setConf(conf: configI) {
    conf.global && this.setGlobal(conf.global); // cache the global middleware configuration
    conf.local && this.setLocal(conf.local); // cache the local middleware configuration
    this.setEnableGlobal( // cache the enabled global middleware 
      this.getGlobal().filter(m => {
        return m.enable;
    }));
    this.setEnableLocal( // cache the enabled local middleware
      this.getLocal().filter(m => {
        return m.enable;
    }));
  }
  
  /**
   * gather all of the enabled global middleware to the warehouse
   */
  private async gatherEnableGMws() {
    const enableGMws = this.getEnableGlobalMws(),
      mwDir = this.mwDir,
      enableGMwList = this.enableGMwList,
      enableGMwConfs = this.enableGMwConfs;
    enableGMws.clear();
    for (let m of enableGMwConfs) {
      await importFile(m.package || join(process.cwd(), mwDir, m.name)).then(instance => {
        if (!enableGMws.has(m.name)) {
          //gather the middleware instance collection to the map warehouse named enableGMWs
          m.instance = instance;
          enableGMws.set(m.name, m); 
          // storage all enabled middleware instance
          if (m.arguments && m.arguments.length) {
            instance = create.apply(null, [(enableGMws.get(m.name) || {instance}).instance].concat(m.arguments));
          }
          enableGMwList.push(instance);
        } else {
          console.error(`the glabal middleware: ${m.name} has been defined!`);
        }
      });
    }
  }
  /**
   * gather all of the enabled local middleware instance to warehouse 
   */
  private async gatherEnableLMws() {
    const enableLMws = this.enableLocalMws,
      mwDir = this.mwDir,
      enableLMwConfs = this.enableLMwConfs;
    enableLMws.clear();
    for (let m of enableLMwConfs) {
      await importFile(m.package || join(process.cwd(), mwDir, m.name)).then(instance => {
        if (!enableLMws.has(m.name)) {
          //gather the middleware instance collection to the map warehouse named enableGMWs
          m.instance = instance;
          enableLMws.set(m.name, m);
        } else {
          console.error(`the glabal middleware: ${m.name} has been defined!`);
        }
      });
    }
  }
  private ready() {
    return this.getEnableGMwList().length > 0;
  }
  /** getter */
  private getGlobal() {
    return this.global || [];
  }
  private getLocal() {
    return this.local || [];
  }
  private getEnableGlobalMws() {
    return this.enableGMws || new Map();
  }
  private getEnableLocalMws() {
    return this.enableLocalMws || new Map();
  }
  private getEnableGMwList() {
    return this.enableGMwList || [];
  }
  private getLocalMwCache() {
    return this.localMwCache || new Map();
  }
  /** setter */
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

  /**
   * handle the all valid middleware for one request, include global enabled middleware and matched local middleware, then autoexec controller.action
   * @param ctx ctx object
   * @param localMws local middleware list for one request
   * @param action the action of local controller 
   */
  async use(ctx: Object, localMws: string | Array<string> = [], action?: Function) {
    if (typeof localMws === 'string') {
      localMws = [localMws];
    }
    this.ready() || await this.run(); // lazy load config, and ensure that only run once 
    const enableLocalMws = this.getEnableLocalMws(); // all enabled local middleware warehouse
    // in the process of the request, use variable mwList to store all valid middleware
    const mwList: Array<any> = this.getEnableGMwList().concat([]); // the initial value is enabled global middleware list
    const localMwCache = this.getLocalMwCache(); // the cache for local middleware
    let instanceOpts:any = null;
    let instance:any = null;
    localMws.forEach(name => {
      if (enableLocalMws.has(name)) { // filter disabled local middleware 
        instanceOpts = enableLocalMws.get(name);
        if (!instanceOpts) {
          return;
        }
        if (localMwCache.has(name)) {
          mwList.push(localMwCache.get(name)); // get local middleware instance from cache 
        } else {
          if (instanceOpts.arguments && instanceOpts.arguments.length) {
            instance = create.apply(null, [instanceOpts.instance].concat(instanceOpts.arguments));
          } else {
            instance = instanceOpts.instance;
          }
          mwList.push(instance); // store enable local instance to variable mwList
          localMwCache.set(name, instance); // cache executed local middleware for 
        }
      };
    });
    mwList.push(this.actionWrap(action)); // add controller.action to middleware queue
    compose(mwList)(ctx); // use nomi-compose to autoexec middleware procedure
  }

  /**
   * action wrap
   * @param action 
   * @returns function
   */
  private actionWrap(action: Function = (() => {})) {
    return (context:Object, next:Function) => action();
  }
}
