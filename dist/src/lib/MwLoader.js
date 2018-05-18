"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_1 = require("../config/default");
const fs_1 = require("../util/fs");
const path_1 = require("path");
const compose_1 = require("./compose");
class MwLoader {
    /**
     * middleware loader module
     * @param confFile  the path of configuration file: save the middleware configuration information
     * @param mwDir the storage directory of all middlewares
     */
    constructor(confFile, mwDir) {
        this.global = []; // the configuration collection of all global middleware 
        this.local = []; // the configuration collection of all local middleware
        this.all = []; // the configuration collection of all middleware
        this.enableGMwConfs = []; // the configuration collection of the all enabled global middleware
        this.enableGMwNames = []; // the name collection of the all enabled global middleware
        this.enableLMwConfs = []; // the configuration collection of the all enabled local middleware
        this.allMws = new Map(); // the map warehouse of all middleware instance
        this.mws = new Map(); // the map warehouse of all enabled middleware instance
        this.enableGMws = new Map(); // the map warehouse of all enabled global middleware instance
        this.enableGMwList = []; // the collection of all enbaled global middleware instance
        this.configuration = confFile;
        this.mwDir = mwDir;
    }
    /**
     * according to the configuration file, cache middleware configuration  and gather middleware instances to map  warehourse
     * @param confFile
     */
    async run() {
        console.log(`middleware loader module read config file success`);
        const conf = await fs_1.importFile(this.configuration); // import the configuration file of all middleware 
        conf && this.setConf(conf); // cache configuration
        await this.gatherEnableGMws(); //  gather all of the enabled global middleware
        this.gatherAll(); // cache all middleware include the global middleware and the local middleware
        await this.gatherAllMws(); // cache all middleware instance 
    }
    /**
     * read configuration file
     * @param conf
     */
    setConf(conf) {
        conf.global && this.setGlobal(conf.global); // cache the global middleware configuration
        conf.local && this.setLocal(conf.local); // cache the local middleware configuration
        this.setEnableGlobal(// cache the enabled global middleware 
        this.getGlobal().filter(m => {
            return m.enable;
        }));
        this.setEnableGMwNames(// cache the name of the enabled global middleware
        this.enableGMwConfs.map(m => {
            return m.name;
        }));
        this.setEnableLocal(// cache the enabled local middleware
        this.getGlobal().filter(m => {
            return !m.enable;
        }));
    }
    /**
     * cache all middleware configuration include global middleware and local middleware
     */
    gatherAll() {
        // cache all global middleware include enabled middleware and disabled middleware
        this.all = this.getGlobal().map(mw => {
            return Object.assign({}, default_1.mwItem, mw, { type: default_1.globalV });
        })
            .concat(
        // cache all lcoal middleware include enabled middleware and disabled middleware
        this.getLocal().map(mw => {
            return Object.assign({}, default_1.mwItem, mw, { type: default_1.localV });
        }));
    }
    /**
     * gather all of the enabled global middleware to the warehouse
     */
    async gatherEnableGMws() {
        const enableGMws = this.enableGMws, mwDir = this.mwDir, enableGMwConfs = this.enableGMwConfs;
        enableGMws.clear();
        for (let m of enableGMwConfs) {
            await fs_1.importFile(m.package || path_1.join(process.cwd(), mwDir, m.name)).then(instance => {
                if (!enableGMws.has(m.name)) {
                    //gather the middleware instance collection to the map warehouse named enableGMWs
                    enableGMws.set(m.name, Object.assign({}, m, { instance }));
                }
                else {
                    console.error(`the glabal middleware: ${m.name} has been defined!`);
                }
            });
        }
    }
    /**
     * gather all of the middleware instance to warehouse
     */
    async gatherAllMws() {
        const all = this.all, allMws = this.allMws, mws = this.mws, enableGMwList = this.enableGMwList, mwDir = this.mwDir;
        let mwInstance = null;
        allMws.clear();
        mws.clear();
        if (all.length) {
            for (let m of all) {
                await fs_1.importFile(m.package || path_1.join(process.cwd(), mwDir, m.name)).then(instance => {
                    if (!allMws.has(m.name)) {
                        // gather all middleware instance to map warehouse named allMws
                        allMws.set(m.name, Object.assign({}, m, { instance }));
                    }
                    else {
                        console.error(` middleware ${m.name} has been defined! `);
                    }
                    if (m.enable && !mws.has(m.name)) {
                        // gather enabled middleware instance to map warehouse named mws
                        mws.set(m.name, Object.assign({}, m, { instance }));
                        // storage all enabled middleware instance
                        enableGMwList.push(new ((mws.get(m.name) || { instance }).instance)(m.options));
                    }
                });
            }
        }
    }
    ready() {
        return this.getEnableGMwList().length > 0;
    }
    getEnableGMws() {
        return this.enableGMws;
    }
    getEnableGMwList() {
        return this.enableGMwList;
    }
    setGlobal(mws = default_1.global) {
        this.global = mws;
    }
    setLocal(mws = default_1.local) {
        this.local = mws;
    }
    setEnableGlobal(mws) {
        this.enableGMwConfs = mws;
    }
    setEnableLocal(mws) {
        this.enableLMwConfs = mws;
    }
    setEnableGMwNames(gMwNames) {
        this.enableGMwNames = gMwNames;
    }
    getEnableGMwNames() {
        return this.enableGMwNames;
    }
    getGlobal() {
        return this.global;
    }
    getLocal() {
        return this.local;
    }
    getMws() {
        return this.mws;
    }
    /**
     * handle the all valid middleware for one request, include global enabled middleware and matched local middleware, then autoexec controller.action
     * @param ctx ctx object
     * @param localMws local middleware list for one request
     * @param action the action of local controller
     */
    async use(ctx, localMws, action) {
        if (typeof localMws === 'string') {
            localMws = [localMws];
        }
        this.ready() || await this.run(); // lazy load config, and ensure that only run once 
        const mws = this.getMws(); // all enabled middleware warehouse
        // in the process of the request, use variable mwList to store all valid middleware
        const mwList = this.getEnableGMwList(); // the initial value is enabled global middleware list
        let instance = null;
        localMws.forEach(name => {
            if (mws.has(name)) {
                instance = mws.get(name);
                instance && mwList.push(new instance.instance(instance.options)); // store enable local instance to variable mwList
            }
            ;
        });
        mwList.push(this.actionWrap(action)); // add controller.action to middleware queue
        compose_1.compose(mwList)(ctx); // use nomi-compose to autoexec middleware procedure
    }
    /**
     * action wrap
     * @param action
     * @returns function
     */
    actionWrap(action = (() => { })) {
        return (context, next) => action();
    }
}
exports.MwLoader = MwLoader;
