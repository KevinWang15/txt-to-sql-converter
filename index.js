//运行方式：
//  node --max_old_space_size=1000000 index.js

var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

const recordsPerRow = 100;

function read(config) {
    var deferred = Promise.defer();

    var input = config.input;
    var list = [];

    if (!config.attrType) config.attrType = {};

    var regex = null;
    var rl = readline.createInterface({input: fs.createReadStream('input/' + input, {encoding: "utf8"})});

    rl.on('line', function (line) {
        var firstLine = false;
        if (regex == null) {
            firstLine = true;
            var fields = line.split(/\s+/m);
            var fieldCount = 0;

            fields.forEach(function (field) {
                if (field == '\n' || field == '\r\n' || !field)
                    return;
                fieldCount++;
            });

            var regexBuilder = [];
            for (var i = 0; i < fieldCount; i++)
                regexBuilder.push('(\\S+)');

            regex = regexBuilder.join('\\s*');
        }

        var match = new RegExp(regex, 'mg').exec(line);
        if (!match) return;
        list.push(config.attrMap(match));
        if (firstLine) {
            Object.keys(list[0]).forEach(function (attr) {
                if (!config.attrType[attr]) {
                    if (+list[0][attr] != list[0][attr]) {
                        config.attrType[attr] = 'text';
                    } else {
                        config.attrType[attr] = 'int';
                    }
                }
            });
        }
    });

    function build(buildConfig) {
        var primaryKeyExists = {};
        var tuples = [];

        var tableName = buildConfig.tableName;
        var attrs = buildConfig.attrs;
        var primaryKeys = buildConfig.primaryKeys;

        if (fs.existsSync('output/' + tableName + '.sql'))
            fs.unlinkSync('output/' + tableName + '.sql');

        var rowCount = 0;

        if (buildConfig.genTableStructure) {

            fs.appendFileSync('output/' + tableName + '.sql',
                'DROP TABLE IF EXISTS `' + tableName + '`;\n' +
                'CREATE TABLE `' + tableName + '` (\n'
                + attrs.map(function (attr) {
                    var attrType = config.attrType[attr];
                    if (attrType == 'text' && primaryKeys.indexOf(attr) >= 0)
                        attrType = 'varchar(255)'

                    return '    `' + attr + '` ' + attrType;
                }).join(',\n')
                + ',\n    PRIMARY KEY (' + primaryKeys.map(function (val) {
                    return '`' + val + '`';
                }).join(',') + ')\n'
                + ');\n'
            );
            //     DROP TABLE IF EXISTS `users`;
            //     CREATE TABLE `users` (
            //         `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
            //         `name` text COLLATE utf8_unicode_ci NOT NULL,
            //         `mobile` text COLLATE utf8_unicode_ci NOT NULL,
            //         `password` text COLLATE utf8_unicode_ci NOT NULL,
            //         `privilege` int(11) NOT NULL DEFAULT '0',
            //         `avatar` text COLLATE utf8_unicode_ci,
            //         `email` text COLLATE utf8_unicode_ci,
            //         `school` text COLLATE utf8_unicode_ci,
            //         `major` text COLLATE utf8_unicode_ci,
            //         `grade` text COLLATE utf8_unicode_ci,
            //         `gender` int(11) DEFAULT NULL,
            //         `info` longtext COLLATE utf8_unicode_ci,
            //         `API_TOKEN` text COLLATE utf8_unicode_ci,
            //         `created_at` timestamp NULL DEFAULT NULL,
            //         `updated_at` timestamp NULL DEFAULT NULL,
            //         `is_admin` int(11) NOT NULL DEFAULT '0',
            //         `ADMIN_API_TOKEN` text COLLATE utf8_unicode_ci,
            //         `more_info` longtext COLLATE utf8_unicode_ci NOT NULL,
            //         `volatile_admin_token` text COLLATE utf8_unicode_ci NOT NULL,
            //         `test_result` text COLLATE utf8_unicode_ci NOT NULL,
            //         PRIMARY KEY (`id`)
            // ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

        }

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

            for (var i = 0; i < tuple.length; i++)
                if (+tuple[i] != tuple[i])
                    tuple[i] = '"' + tuple[i] + '"';

            tuples.push('(' + tuple.join(',') + ')');

            rowCount++;

            if (rowCount % recordsPerRow == 0)
                writeFile();

        });

        if (rowCount % recordsPerRow != 0)
            writeFile();
    }

    rl.on('close', function () {
        deferred.resolve(build);
    });

    return deferred.promise;
}


read({
    input: 'trade2.txt',
    attrMap: function (field) {
        return {
            tradeID: field[1],
            stuID: field[2],
            posID: field[9],
            tradeDate: field[6],
            tradeTime: field[7],
            tradeAmount: field[8]
        };
    },
    attrType: {}
}).then(function (build) {
    build({
        tableName: 'trade',
        attrs: ['tradeID', 'stuID', 'posID', 'tradeDate', 'tradeTime', 'tradeAmount'],
        primaryKeys: ['tradeID'],
        genTableStructure: true
    });
});


read({
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


read({
    input: 'students.txt',
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

