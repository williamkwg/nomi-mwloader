"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_1 = require("../config/default");
const fs_1 = require("../util/fs");
const path_1 = require("path");
const compose = require("koa-compose");
class MwLoader {
    /**
     * 中间件加载模块 处理中间件
     * @param confFile  中间件配置文件  middleware.js
     * @param mwDir 所有中间件的存放目录
     */
    constructor(confFile, mwDir) {
        this.global = []; //全局的中间件 配置
        this.local = []; // 应用的中间件 配置
        this.all = []; // 所有的中间件 配置
        this.enableGMwConfs = []; // 全局启用的中间件 配置列表
        this.enableGMwNames = []; // 启用的全局中间件 名称列表
        this.enableLMwConfs = []; // 业务启用的中间件 配置列表
        this.allMws = new Map(); // 所有的 中间件实例 中央库
        this.mws = new Map(); // 所有启用状态 中间件实例 中央库 
        this.enableGMws = new Map(); // 启用状态的全局中间件实例 映射池
        this.config = confFile;
        this.mwDir = mwDir;
    }
    /**
     * 根据配置文件 收集中间件实例
     * @param confFile
     */
    async run() {
        const conf = await fs_1.importFile(this.config);
        conf && this.setConf(conf);
        await this.gatherEnableGMws();
        this.gatherAll();
        await this.gatherAllMws();
    }
    /**
     * 处理 配置文件
     * @param conf
     */
    setConf(conf) {
        conf.global && this.setGlobal(conf.global);
        conf.local && this.setLocal(conf.local);
        this.setEnableGlobal(this.getGlobal().filter(m => {
            return m.enable;
        }));
        this.setEnableGMwNames(this.enableGMwConfs.map(m => {
            return m.name;
        }));
        this.setEnableLocal(this.getGlobal().filter(m => {
            return !m.enable;
        }));
    }
    /**
     * 收集所有中间件配置 列表
     */
    gatherAll() {
        this.all = this.getGlobal().map(mw => {
            return Object.assign({}, default_1.mwItem, mw, { type: default_1.globalV });
        })
            .concat(this.getLocal().map(mw => {
            return Object.assign({}, default_1.mwItem, mw, { type: default_1.localV });
        }));
    }
    /**
     * 收集启用状态的全局中间件 入库
     */
    async gatherEnableGMws() {
        const enableGMws = this.enableGMws, mwDir = this.mwDir, enableGMwConfs = this.enableGMwConfs;
        enableGMws.clear();
        for (let m of enableGMwConfs) {
            await fs_1.importFile(m.package || path_1.join(mwDir, m.name)).then(instance => {
                if (!enableGMws.has(m.name)) {
                    //收集所有的中间件实例 确定映射关系 存入中央库备用
                    enableGMws.set(m.name, Object.assign({}, m, { instance }));
                }
                else {
                    console.error(`全局中间件${m.name}重复定义`);
                }
            });
        }
    }
    /**
     * 收集 所有中间件实例 => 中央库
     */
    async gatherAllMws() {
        const all = this.all, allMws = this.allMws, mws = this.mws, mwDir = this.mwDir;
        allMws.clear();
        mws.clear();
        if (all.length) {
            for (let m of all) {
                await fs_1.importFile(m.package || path_1.join(mwDir, m.name)).then(instance => {
                    if (!allMws.has(m.name)) {
                        //收集所有的中间件实例 确定映射关系 存入中央库备用
                        allMws.set(m.name, Object.assign({}, m, { instance }));
                    }
                    else {
                        console.error(`中间件${m.name}重复定义`);
                    }
                    if (m.enable && !mws.has(m.name)) {
                        //收集启用状态的的中间件实例 确定映射关系 存入有效中央库备用
                        mws.set(m.name, Object.assign({}, m, { instance }));
                    }
                });
            }
        }
    }
    getEnableGMws() {
        return this.enableGMws;
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
     * 对外暴露API：加载传入的应用程序的中间件  + loader会默认加载全局中间件，调用方只需要传入业务的中间件列表即可
     * mwLoaderInstance.use(app, mws)
     * @param app: koa实例
     * @param mws: 业务中间件名称 | 列表
     */
    async use(app, localMws) {
        if (typeof localMws === 'string') {
            localMws = [localMws];
        }
        await this.run();
        const mws = this.getMws(); // 启用状态的中间件库
        const globalMws = this.getEnableGMwNames();
        const mwList = [];
        let instance = null;
        globalMws.concat(localMws).forEach(name => {
            if (mws.has(name)) {
                instance = mws.get(name);
                instance && mwList.push(new instance.instance(instance.options)); //将中间件函数对象存入集合
            }
            ;
        });
        app.use(compose(mwList)); //应用的中间件流-队列
    }
}
exports.MwLoader = MwLoader;
