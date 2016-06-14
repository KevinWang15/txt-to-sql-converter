txt-to-sql-converter
==========

NodeJS space-separated database text file to sql insert statements converter (Experimental).

## Input: space-separated database text file

```
169574	79265	许春婷	243020001	一食堂一组	2012-09-18	16:47:28.000	150.00	0007
169577	75850	吴静	243020001	一食堂一组	2012-09-18	16:48:18.000	150.00	0007
169580	101116	魏梦	243020002	一食堂二组	2012-09-18	16:52:39.000	150.00	0015
169583	76312	周经学	243020002	一食堂二组	2012-09-18	16:52:18.000	600.00	0026
...
```

## Installation

    npm install --save KevinWang15/txt-to-sql-converter


## Output: .sql file with insert statements

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
var converter = require('./txt-to-sql-converter'),
    fs = require('fs');

converter({
    //source, usually a txt file
    inputStream: fs.createReadStream('input/trade2.txt'),

    //Specify Encoding
    encoding: 'utf8',

    //how many tuples after "insert into ... (...,...) values " in a statement?
    recordsPerStatement: 200,

    //Map txt source to attributes
    attrMap: function (field) {
        return {
            tradeID: field[1],
            stuID: field[2],
            tradeDate: field[6],
            tradeTime: field[7],

            //Pre-process data here. Multiply amount by 100.
            tradeAmount: ((+field[8]) * 100).toFixed(0),

            posID: field[9]
        };
    },
    attrType: {
        //set attribute types, used for generating DDL and optimizing insert statements
        tradeDate: 'date',
        tradeTime: 'time',
        tradeAmount: 'int'
    },
    defaultValue: {
        //set default values
        tradeAmount: 100
    }
}).then(function (build) {
    //after reading and parsing txt,
    //build becomes available
    build({
        //what table name to build?
        tableName: 'trade',
        //what are the attributes (set according to the keys in attrMap)
        attrs: ['tradeID', 'stuID', 'posID', 'tradeDate', 'tradeTime', 'tradeAmount'],
        //the primary key? for DDL, also for eliminating duplicates
        primaryKeys: ['tradeID'],
        //do you wish to generate DDL as well?
        genTableStructure: true,
        //where to output the results, usually a txt file.
        outputStream: fs.createWriteStream('output/trade.sql', {encoding: 'utf8'})
    });
});

converter({
    inputStream: fs.createReadStream('input/students.txt'),
    attrType: {
        stuID: 'text'
    },
    attrMap: function (field) {
        return {
            ID: field[1],
            stuID: field[2],
            name: field[3],
            clsID: field[4],
            clsName: field[5],
            deptNo: field[6],
            deptName: field[7],
            schID: field[8],
            schName: field[9],
            grade: field[10]
        };
    }
}).then(function (build) {

    //in this example,
    //after txt is read and parsed,
    //multiple tables are generated using build().
    //you may use txt as a data source,
    //decompose database schema,
    //and generate multiple schemas that are compliant with BCNF, etc.

    build({
        tableName: 'student',
        attrs: ['ID', 'stuID', 'name', 'clsID', 'grade'],
        primaryKeys: ['ID', 'stuID'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/student.sql', {encoding: 'utf8'})
    });

    build({
        tableName: 'class',
        attrs: ['clsID', 'clsName', 'deptNo'],
        primaryKeys: ['clsID'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/class.sql', {encoding: 'utf8'})
    });

    build({
        tableName: 'dept',
        attrs: ['deptNo', 'deptName', 'schID'],
        primaryKeys: ['deptNo'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/dept.sql', {encoding: 'utf8'})
    });

    build({
        tableName: 'school',
        attrs: ['schID', 'schName'],
        primaryKeys: ['schID'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/school.sql', {encoding: 'utf8'})
    });
});


converter({
    inputStream: fs.createReadStream('input/shop.txt'),
    attrMap: function (field) {
        return {
            shopID: field[1],
            POSID: field[2],
            shopName: field[3]
        };
    }
}).then(function (build) {
    build({
        tableName: 'shop',
        attrs: ['shopID', 'POSID', 'shopName'],
        primaryKeys: ['shopID', 'POSID'],
        genTableStructure: true,
        //In this example, the result is piped to stdout
        outputStream: process.stdout
    });
});
```


## Memory Limit
All data are read into the memory in the beginning, if you wish to increase the memory limit of your nodeJS script, run with 
```
node --max_old_space_size=1000000 your_script.js
```