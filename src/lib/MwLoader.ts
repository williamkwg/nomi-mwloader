
import { global, local, mwItem, globalV, localV } from '../config/default';
import { getFiles, importFile } from '../util/fs'
import { middlewareI, configI, Map } from '../interface'
import { join } from 'path';
import { compose } from './compose';
import middleware from '../../test/config/middleware';

export class MwLoader {
  private global: Array<middlewareI> = []; // the configuration collection of all global middleware 
  private local: Array<middlewareI> = [];  // the configuration collection of all local middleware
  private all: Array<middlewareI> = []; // the configuration collection of all middleware
  private enableGMwConfs: Array<middlewareI> = []; // the configuration collection of the all enabled global middleware
  private enableGMwNames: Array<string> = []; // the name collection of the all enabled global middleware
  private enableLMwConfs: Array<middlewareI> = []; // the configuration collection of the all enabled local middleware
  private allMws: Map<string, middlewareI> = new Map(); // the map warehouse of all middleware instance
  private mws: Map<string, middlewareI> = new Map(); // the map warehouse of all enabled middleware instance
  private enableGMws: Map<string, middlewareI> = new Map(); // the map warehouse of all enabled global middleware instance
  private enableGMwList: Array<any> = []; // the collection of all enbaled global middleware instance
  private mwDir: string; // the storeage directory of all middlewares
  private configuration: string; // the path of configuration file

  /**
   * middleware loader module
   * @param confFile  the path of configuration file: save the middleware configuration information 
   * @param mwDir the storage directory of all middlewares
   */
  constructor(confFile: string, mwDir: string) {
    this.configuration = confFile;
    this.mwDir = mwDir;
  }
  /**
   * according to the configuration file, cache middleware configuration  and gather middleware instances to map  warehourse
   * @param confFile 
   */
  private async run() {
    console.log(`middleware loader module read config file success`);
    const conf = await importFile(this.configuration); // import the configuration file of all middleware 
    conf && this.setConf(conf as configI); // cache configuration
    await this.gatherEnableGMws(); //  gather all of the enabled global middleware
    this.gatherAll();  // cache all middleware include the global middleware and the local middleware
    await this.gatherAllMws(); // cache all middleware instance 
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
    this.setEnableGMwNames( // cache the name of the enabled global middleware
      this.enableGMwConfs.map(m => {
        return m.name;
      })
    );
    this.setEnableLocal( // cache the enabled local middleware
      this.getGlobal().filter(m => {
        return !m.enable;
    }));
  }
  
  /**
   * cache all middleware configuration include global middleware and local middleware
   */
  private gatherAll() {
     // cache all global middleware include enabled middleware and disabled middleware
    this.all = this.getGlobal().map(mw => {
      return { ...mwItem, ...mw, type: globalV };
    })
    .concat(
      // cache all lcoal middleware include enabled middleware and disabled middleware
      this.getLocal().map(mw => {
        return { ...mwItem, ...mw, type: localV };
      })
    );
  }
  /**
   * gather all of the enabled global middleware to the warehouse
   */
  private async gatherEnableGMws() {
    const enableGMws = this.enableGMws,
      mwDir = this.mwDir,
      enableGMwConfs = this.enableGMwConfs;
    enableGMws.clear();
    for (let m of enableGMwConfs) {
      await importFile(m.package || join(process.cwd(), mwDir, m.name)).then(instance => {
        if (!enableGMws.has(m.name)) {
          //gather the middleware instance collection to the map warehouse named enableGMWs
          enableGMws.set(m.name, {...m, instance }); 
        } else {
          console.error(`the glabal middleware: ${m.name} has been defined!`);
        }
      });
    }
  }
  /**
   * gather all of the middleware instance to warehouse 
   */
  private async gatherAllMws() {
    const all = this.all,
      allMws = this.allMws,
      mws = this.mws,
      enableGMwList = this.enableGMwList,
      mwDir = this.mwDir;
    let mwInstance = null;
    allMws.clear();
    mws.clear();
    if (all.length) {
      for(let m of all) {
        await importFile(m.package || join(process.cwd(), mwDir, m.name)).then(instance => { // import file from npm package or path
          if (!allMws.has(m.name)) {
            // gather all middleware instance to map warehouse named allMws
            allMws.set(m.name, {...m, instance}); 
          } else {
            console.error(` middleware ${m.name} has been defined! `);
          }
          if (m.enable && !mws.has(m.name)) {
            // gather enabled middleware instance to map warehouse named mws
            mws.set(m.name, {...m, instance});
            // storage all enabled middleware instance
            enableGMwList.push(new ((mws.get(m.name) || {instance}).instance)(m.options));
          }
        })
      }
    }
  }
  private ready() {
    return this.getEnableGMwList().length > 0;
  }
  private getEnableGMws() {
    return this.enableGMws;
  }
  private getEnableGMwList() {
    return this.enableGMwList;
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
   * handle the all valid middleware for one request, include global enabled middleware and matched local middleware, then autoexec controller.action
   * @param ctx ctx object
   * @param localMws local middleware list for one request
   * @param action the action of local controller 
   */
  async use(ctx: Object, localMws: string | Array<string>, action?: Function) {
    if (typeof localMws === 'string') {
      localMws = [localMws];
    }
    this.ready() || await this.run(); // lazy load config, and ensure that only run once 
    const mws = this.getMws(); // all enabled middleware warehouse
    // in the process of the request, use variable mwList to store all valid middleware
    const mwList: Array<any> = this.getEnableGMwList(); // the initial value is enabled global middleware list
    let instance = null;
    localMws.forEach(name => {
      if (mws.has(name)) { // filter disabled local middleware 
        instance = mws.get(name);
        instance && mwList.push(new instance.instance(instance.options)); // store enable local instance to variable mwList
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
