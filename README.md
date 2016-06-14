txt-to-sql-converter
==========

NodeJS space-separated database text file to sql insert statements converter (Experimental).

## Input: space-separated database text file (input/trade2.txt)

```
169574	79265	许春婷	243020001	一食堂一组	2012-09-18	16:47:28.000	150.00	0007
169577	75850	吴静	243020001	一食堂一组	2012-09-18	16:48:18.000	150.00	0007
169580	101116	魏梦	243020002	一食堂二组	2012-09-18	16:52:39.000	150.00	0015
169583	76312	周经学	243020002	一食堂二组	2012-09-18	16:52:18.000	600.00	0026
...
```

## Output: .sql file with insert statements (output/trade.sql)

```sql
DROP TABLE IF EXISTS `trade`;
CREATE TABLE `trade` (
    `tradeID` int,
    `stuID` int,
    `posID` int,
    `tradeDate` date,
    `tradeTime` time,
    `tradeAmount` int DEFAULT 100,
    PRIMARY KEY (`tradeID`)
);
insert into trade (tradeID,stuID,posID,tradeDate,tradeTime,tradeAmount) values (169574,79265,0007,"2012-09-18","16:47:28.000",15000),(169577,75850,0007,"2012-09-18","16:48:18.000",15000),...
insert into trade (tradeID,stuID,posID,tradeDate,tradeTime,tradeAmount) values (170209,65643,0178,"2012-09-18","17:00:53.000",80000),(170212,75053,0165,"2012-09-18","17:00:04.000",73000),...
insert into trade (tradeID,stuID,posID,tradeDate,tradeTime,tradeAmount) values (169181,107797,0131,"2012-09-18","16:46:29.000",10500),(169184,107513,0104,"2012-09-18","16:46:55.000",14700),...
...
```

## Code

```javascript
var converter = require('./txt-to-sql-converter');

converter({
    input: 'trade2.txt',
    encoding: 'utf8',
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
2. Make it a npm package/cli tool.