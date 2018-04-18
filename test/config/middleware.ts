export default {
  "global": [ // 全局中间件：每一个 请求都会流经
     {
      "name": "hello", //中间件名字
      "package": "", // 无此项则从config指定目录中获取
      "enable": true,  // 中间件启用与否  
      "match": '*', // 符合正则的request 会流经该中间件  
      "options": {}
    },
    {
      name: "method",
      package: "",
      enable: true,
      match: "",
      options: {}
    }
  ],
  "local": [// 业务中间件池
    {
      name: 'localA',
      package: "",
      enable: true,
      match: "",
      options: {}
    } 
  ] 
};