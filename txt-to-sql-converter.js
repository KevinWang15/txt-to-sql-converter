var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

const numericTypes = ['int', 'integer', 'tinyint', 'smallint', 'mediumint', 'bigint', 'real', 'decimal', 'numeric', 'float', 'double'];

function txtToSqlConverter(config) {

    if (!config.recordsPerStatement)
        config.recordsPerStatement = 100;

    var deferred = Promise.defer();

    var input = config.input;
    var list = [];

    if (!config.attrType) config.attrType = {};
    if (!config.defaultValue) config.defaultValue = {};

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
                        attrType = 'varchar(255)';

                    var builder = '    `' + attr + '` ' + attrType;

                    if (!!config.defaultValue[attr])
                        builder += ' DEFAULT ' + ((numericTypes.indexOf(attrType) >= 0) ? (config.defaultValue[attr]) : '"' + (config.defaultValue[attr]) + '"');


                    return builder;

                }).join(',\n')
                + ',\n    PRIMARY KEY (' + primaryKeys.map(function (val) {
                    return '`' + val + '`';
                }).join(',') + ')\n'
                + ');\n'
            );
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
                if (numericTypes.indexOf(config.attrType[attr]) >= 0)
                    tuple.push(item[attr]);
                else
                    tuple.push('"' + item[attr] + '"');
            });

            primaryKeys.forEach(function (attr) {
                primaryTuple.push(item[attr]);
            });

            var primaryKeyHash = primaryTuple.join('');

            if (primaryKeyExists[primaryKeyHash]) return;

            primaryKeyExists[primaryKeyHash] = true;

            tuples.push('(' + tuple.join(',') + ')');

            rowCount++;

            if (rowCount % config.recordsPerStatement == 0)
                writeFile();

        });

        if (rowCount % config.recordsPerStatement != 0)
            writeFile();
    }

    rl.on('close', function () {
        deferred.resolve(build);
    });

    return deferred.promise;
}

module.exports = txtToSqlConverter;