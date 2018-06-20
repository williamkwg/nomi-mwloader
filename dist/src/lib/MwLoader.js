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
        this.enableGMwConfs = []; // the configuration collection of the all enabled global middleware
        this.enableLMwConfs = []; // the configuration collection of the all enabled local middleware
        this.enableLocalMws = new Map(); // the map warehouse of all enabled local middleware instance
        this.enableGMws = new Map(); // the map warehouse of all enabled global middleware instance
        this.enableGMwList = []; // the collection of all enbaled global middleware instance
        this.localMwCache = new Map(); // the cache map of the executed local middleware
        this.configuration = confFile;
        this.mwDir = mwDir;
    }
    /**
     * according to the configuration file, cache middleware configuration  and gather middleware instances to map  warehourse
     * @param confFile
     */
    async run() {
        let config = {};
        console.log(`middleware loader module read config file success`);
        if (typeof this.configuration === 'string') {
            config = await fs_1.importFile(this.configuration); // import the configuration file of all middleware 
        }
        else {
            config = this.configuration;
        }
        config && this.setConf(config); // cache configuration
        await this.gatherEnableGMws(); //  gather all of the enabled global middleware
        await this.gatherEnableLMws(); // cache all middleware instance 
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
        this.setEnableLocal(// cache the enabled local middleware
        this.getLocal().filter(m => {
            return m.enable;
        }));
    }
    /**
     * gather all of the enabled global middleware to the warehouse
     */
    async gatherEnableGMws() {
        const enableGMws = this.getEnableGlobalMws(), mwDir = this.mwDir, enableGMwList = this.enableGMwList, enableGMwConfs = this.enableGMwConfs;
        enableGMws.clear();
        let instance = null;
        for (let m of enableGMwConfs) {
            await fs_1.importFile(m.package || path_1.join(process.cwd(), mwDir, m.name)).then(instance => {
                if (!enableGMws.has(m.name)) {
                    //gather the middleware instance collection to the map warehouse named enableGMWs
                    enableGMws.set(m.name, Object.assign({}, m, { instance }));
                    // storage all enabled middleware instance
                    if (m.arguments && m.arguments.length) {
                        instance = fs_1.create.apply(null, [(enableGMws.get(m.name) || { instance }).instance].concat(m.arguments));
                    }
                    else {
                        instance = m.instance;
                    }
                    enableGMwList.push(instance);
                }
                else {
                    console.error(`the glabal middleware: ${m.name} has been defined!`);
                }
            });
        }
    }
    /**
     * gather all of the enabled local middleware instance to warehouse
     */
    async gatherEnableLMws() {
        const enableLMws = this.enableLocalMws, mwDir = this.mwDir, enableLMwConfs = this.enableLMwConfs;
        enableLMws.clear();
        for (let m of enableLMwConfs) {
            await fs_1.importFile(m.package || path_1.join(process.cwd(), mwDir, m.name)).then(instance => {
                if (!enableLMws.has(m.name)) {
                    //gather the middleware instance collection to the map warehouse named enableGMWs
                    enableLMws.set(m.name, Object.assign({}, m, { instance }));
                }
                else {
                    console.error(`the glabal middleware: ${m.name} has been defined!`);
                }
            });
        }
    }
    ready() {
        return this.getEnableGMwList().length > 0;
    }
    /** getter */
    getGlobal() {
        return this.global;
    }
    getLocal() {
        return this.local;
    }
    getEnableGlobalMws() {
        return this.enableGMws;
    }
    getEnableLocalMws() {
        return this.enableLocalMws;
    }
    getEnableGMwList() {
        return this.enableGMwList;
    }
    getLocalMwCache() {
        return this.localMwCache;
    }
    /** setter */
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
        const enableLocalMws = this.getEnableLocalMws(); // all enabled local middleware warehouse
        // in the process of the request, use variable mwList to store all valid middleware
        const mwList = this.getEnableGMwList().concat([]); // the initial value is enabled global middleware list
        const localMwCache = this.getLocalMwCache(); // the cache for local middleware
        let instanceOpts = null;
        let instance = null;
        localMws.forEach(name => {
            if (enableLocalMws.has(name)) {
                instanceOpts = enableLocalMws.get(name);
                if (!instanceOpts) {
                    return;
                }
                if (localMwCache.has(name)) {
                    mwList.push(localMwCache.get(name)); // get local middleware instance from cache 
                }
                else {
                    if (instanceOpts.arguments && instanceOpts.arguments.length) {
                        instance = fs_1.create.apply(null, [instanceOpts.instance].concat(instanceOpts.arguments));
                    }
                    else {
                        instance = instanceOpts.instance;
                    }
                    mwList.push(instance); // store enable local instance to variable mwList
                    localMwCache.set(name, instance); // cache executed local middleware for 
                }
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
exports.default = MwLoader;
