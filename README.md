# nomi-mwloader

the middleware-loader tool for loading the nomi middlewares!

## Installation

``` bash
$ npm install nomi-mwloader --save
```

Node.js >= 8.0.0  required.

## API

- use

## Usage

``` javascript

const MiddlewareLoader = require('nomi-mwloader');
const ctx = new Koa().ctx;
const mwLoader = new MiddlewareLoader({
      "global": [
        {
          "name": "GMiddleware", 
          "enable": true
        }],
      "local": [ 
        {
          "name": 'LMiddleware',
          "enable": true
        }
      ] 
    }, 'd:app');

mwLoader.use(ctx, 'LMiddleware');
mwLoader.use(ctx, ['LMiddleware']);
mwLoader.use(ctx, 'LMiddleware', () => {
  // to do something
});

```
