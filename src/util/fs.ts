import { readdir, stat, read } from 'fs';
import { join, extname } from 'path';
import { Promise } from 'es6-promise';
import { resolve } from 'url';

export const create = (cb:any, ...arg:any[]) => {
  try {
    return new cb(...arg);
  } catch {
    return cb(...arg);
  }
}
/**
 * 根据文件地址 异步的动态引入文件 并返回promise.resolve(default对象)
 * @param file : 文件地址
 */
export const importFile = (file: string) => {
  return new Promise((resolve, reject) => {
    import(file).then(result => {
      if (result && result.default) {
        resolve(result.default);
      } else {
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
}
/**
 * 递归读取dir目录下 所有后缀为postfix 的文件 
 * @param dir 
 * @param postfix 
 */
export const getFiles = (dir: string, postfix: string | Array<string> = ['.js', '.ts']): Array<string> => {
  postfix = typeof postfix === 'string' ? [postfix] : postfix;
  const files: Array<string> = [];
  const readDir = (dir: string, postfix: Array<string>) => {
    readdir(dir, (err, files) => {
      if (err) {
        console.info(`读取目录${dir} 失败！`);
        return;
      }
      files.forEach(filename => {
        const fileDir = join(dir, filename);
        stat(fileDir, (error, stats) => {
          if (stats.isFile() && (extname(filename) === '.js' || extname(filename) === '.ts')) {
            files.push(fileDir);
          }
          if (stats.isDirectory()) {
            getFiles(fileDir);
          }
        });
      });
    });
  };
  readDir(dir, postfix);
  return files;
}