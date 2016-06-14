txt-to-sql-converter
==========

NodeJS space-separated database text file to sql insert statements converter (Experimental).

## Input: space-separated database text file

```
37918	0811002059	曹星星	3566	信105	140	电子信息工程	11	电子信息学院	2010
37954	0811002095	张健	2891	信093	140	电子信息工程	11	电子信息学院	2009
37957	0811002098	赵天立	2976	电信114	134	电气信息大类(电子)	11	电子信息学院	2011
37967	0811002108	冯杰	3569	通信103	144	通信工程	11	电子信息学院	2010
37973	0811002114	赵超	2879	集093	137	集成电路设计与集成系统	11	电子信息学院	2009
...
```

## Output: .sql file with insert statements 

```sql
insert into student (ID,stuID,name,clsID,grade) values (37918,0811002059,"曹星星",3566,2010),(37954,0811002095,"张健",2891,2009),(37957,0811002098,"赵天立",2976,2011),...
insert into student (ID,stuID,name,clsID,grade) values (41297,0903012023,"徐蕾",224,2009),(41298,0903012024,"陈丽",224,2009),(41299,0903012025,"张蓉",224,2009),...
...
```

## Code

```javascript
var converter = require('./txt-to-sql-converter');

converter({
    input: 'trade2.txt',
    recordsPerStatement: 200,
    attrMap: function (field) {
        return {
            tradeID: field[1],
            stuID: field[2],
            posID: field[9],
            tradeDate: field[6],
            tradeTime: field[7],
            tradeAmount: ((+field[8]) * 100).toFixed(0)
        };
    },
    attrType: {
        tradeDate: 'date',
        tradeTime: 'time',
        tradeAmount: 'int'
    },
    defaultValue: {
        tradeAmount: 100
    }
}).then(function (build) {
    build({
        tableName: 'trade',
        attrs: ['tradeID', 'stuID', 'posID', 'tradeDate', 'tradeTime', 'tradeAmount'],
        primaryKeys: ['tradeID'],
        genTableStructure: true
    });

    //build({
    //   ...
    //})
    
    //...
    
    //You may decompose database schema,
    //and build other tables with build(..)

});

```


## Run
Increase memory limit, run with 
```
node --max_old_space_size=1000000 index.js
```

## TODO
1. Use stream for reading file, avoid high memory usage.
2. Support for encoding config.
3. Make it a npm package/cli tool.