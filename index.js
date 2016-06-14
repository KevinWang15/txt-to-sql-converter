//运行方式：
//  node --max_old_space_size=1000000 index.js

var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');


const recordsPerRow = 100;


function read(config) {

    var deferred = Promise.defer();

    var input = config.input, fieldCount = config.fieldCount;
    var list = [];

    var regexBuilder = [];
    for (var i = 0; i < fieldCount; i++)
        regexBuilder.push('(\\S+)');

    regexBuilder = regexBuilder.join('\\s*');

    var rl = readline.createInterface({input: fs.createReadStream('input/' + input, {encoding: "utf8"})});

    rl.on('line', function (line) {
        var match = new RegExp(regexBuilder, 'mg').exec(line);
        if (!match) return;
        list.push(config.attrMap(match));
    });

    function build(config) {
        var primaryKeyExists = {};
        var tuples = [];

        var tableName = config.tableName;
        var attrs = config.attrs;
        var primaryKeys = config.primaryKeys;

        if (fs.existsSync('output/' + tableName + '.sql'))
            fs.unlinkSync('output/' + tableName + '.sql');

        var rowCount = 0;

        function writeFile() {
            var content = 'insert into ' + tableName + ' (' + attrs.join(',') + ') values ' + tuples.join(',') + ';';
            fs.appendFileSync('output/' + tableName + '.sql', content + '\n');
            tuples.splice(0);
        }

        list.forEach(function (item) {
            var tuple = [];
            var primaryTuple = [];
            attrs.forEach(function (attr) {
                tuple.push(item[attr]);
            });

            primaryKeys.forEach(function (attr) {
                primaryTuple.push(item[attr]);
            });

            var primaryKeyHash = primaryTuple.join('');

            if (primaryKeyExists[primaryKeyHash]) return;

            primaryKeyExists[primaryKeyHash] = true;
            for (var i = 0; i < tuple.length; i++) {
                if (+tuple[i] != tuple[i])
                    tuple[i] = '"' + tuple[i] + '"';
            }
            tuples.push('(' + tuple.join(',') + ')');
            rowCount++;
            if (rowCount % recordsPerRow == 0) {
                writeFile();
            }
        });

        if (rowCount % recordsPerRow != 0)
            writeFile();
    }

    rl.on('close', function () {
        deferred.resolve(build);
    });

    return deferred.promise;
}


read(
    {
        input: 'trade2.txt',
        fieldCount: 9,
        attrMap: function (field) {
            return {
                tradeID: field[1],
                stuID: field[2],
                posID: field[9],
                tradeDate: field[6],
                tradeTime: field[7],
                tradeAmount: field[8]
            };
        }
    })
    .then(function (build) {
        build({
            tableName: 'trade',
            attrs: ['tradeID', 'stuID', 'posID', 'tradeDate', 'tradeTime', 'tradeAmount'],
            primaryKeys: ['tradeID']
        });
    });


read(
    {
        input: 'shop.txt',
        fieldCount: 3,
        attrMap: function (field) {
            return {
                shopID: field[1],
                POSID: field[2],
                shopName: field[3]
            };
        }
    })
    .then(function (build) {
        build({
            tableName: 'shop',
            attrs: ['shopID', 'POSID', 'shopName'],
            primaryKeys: ['shopID', 'POSID']
        });
    });


read(
    {
        input: 'students.txt',
        fieldCount: 10,
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
    })
    .then(function (build) {
        build({
            tableName: 'student',
            attrs: ['ID', 'stuID', 'name', 'clsID', 'grade'],
            primaryKeys: ['ID', 'stuID']
        });

        build({
            tableName: 'class',
            attrs: ['clsID', 'clsName', 'deptNo'],
            primaryKeys: ['clsID']
        });

        build({
            tableName: 'dept',
            attrs: ['deptNo', 'deptName', 'schID'],
            primaryKeys: ['deptNo']
        });

        build({
            tableName: 'school',
            attrs: ['schID', 'schName'],
            primaryKeys: ['schID']
        });
    });

