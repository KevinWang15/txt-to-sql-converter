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
        primaryKeys: ['tradeID', 'stuID'],
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
            posID: field[2],
            shopName: field[3]
        };
    }
}).then(function (build) {
    build({
        tableName: 'pos',
        attrs: ['posID', 'shopID'],
        primaryKeys: ['posID'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/pos.sql', {encoding: 'utf8'})
    });

    build({
        tableName: 'shop',
        attrs: ['shopID', 'shopName'],
        primaryKeys: ['shopID'],
        genTableStructure: true,
        outputStream: fs.createWriteStream('output/shop.sql', {encoding: 'utf8'})
    });
});

