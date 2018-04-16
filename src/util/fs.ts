import { readdir, stat, read } from 'fs';
import { join, extname } from 'path';

export const getFiles = (dir: string, postfix: string | Array<string> = ['.js', '.ts']) => {
  postfix = typeof postfix === 'string' ? [postfix] : postfix;
  const files = [];
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