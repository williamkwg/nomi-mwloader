"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const es6_promise_1 = require("es6-promise");
exports.create = (cb, ...arg) => {
    try {
        return new cb(...arg);
    }
    catch (_a) {
        return cb(...arg);
    }
};
/**
 * 根据文件地址 异步的动态引入文件 并返回promise.resolve(default对象)
 * @param file : 文件地址
 */
exports.importFile = (file) => {
    return new es6_promise_1.Promise((resolve, reject) => {
        Promise.resolve().then(() => require(file)).then(result => {
            if (result && result.default) {
                resolve(result.default);
            }
            else {
                resolve(result);
            }
            if (!result) {
                reject({});
            }
        }).catch(err => {
            reject({});
            console.log('read file error, uri:', file);
        });
    });
};
/**
 * 递归读取dir目录下 所有后缀为postfix 的文件
 * @param dir
 * @param postfix
 */
exports.getFiles = (dir, postfix = ['.js', '.ts']) => {
    postfix = typeof postfix === 'string' ? [postfix] : postfix;
    const files = [];
    const readDir = (dir, postfix) => {
        fs_1.readdir(dir, (err, files) => {
            if (err) {
                console.info(`读取目录${dir} 失败！`);
                return;
            }
            files.forEach(filename => {
                const fileDir = path_1.join(dir, filename);
                fs_1.stat(fileDir, (error, stats) => {
                    if (stats.isFile() && (path_1.extname(filename) === '.js' || path_1.extname(filename) === '.ts')) {
                        files.push(fileDir);
                    }
                    if (stats.isDirectory()) {
                        exports.getFiles(fileDir);
                    }
                });
            });
        });
    };
    readDir(dir, postfix);
    return files;
};
