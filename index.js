var converter = require('./txt-to-sql-converter');

converter({
    input: 'trade2.txt',
    encoding: 'utf8',
    recordsPerStatement: 200,
    attrMap: function (field) {
        return {
            tradeID: field[1],
            stuID: field[2],
            tradeDate: field[6],
            tradeTime: field[7],
            tradeAmount: ((+field[8]) * 100).toFixed(0),
            posID: field[9]
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


converter({
    input: 'shop.txt',
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
        genTableStructure: true
    });
});


converter({
    input: 'students.txt',
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
    build({
        tableName: 'student',
        attrs: ['ID', 'stuID', 'name', 'clsID', 'grade'],
        primaryKeys: ['ID', 'stuID'],
        genTableStructure: true
    });

    build({
        tableName: 'class',
        attrs: ['clsID', 'clsName', 'deptNo'],
        primaryKeys: ['clsID'],
        genTableStructure: true
    });

    build({
        tableName: 'dept',
        attrs: ['deptNo', 'deptName', 'schID'],
        primaryKeys: ['deptNo'],
        genTableStructure: true
    });

    build({
        tableName: 'school',
        attrs: ['schID', 'schName'],
        primaryKeys: ['schID'],
        genTableStructure: true
    });
});

