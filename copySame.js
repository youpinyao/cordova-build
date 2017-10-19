var fs = require('fs'),
    stat = fs.stat;
var process = require('process');
var arguments = process.argv.splice(2);


var src = arguments[0];
var srcClone = arguments[1];
var dst = arguments[2];


/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
var copy = function(src, srcClone, dst) {
    // 读取目录中的所有文件/目录
    fs.readdir(src, function(err, paths) {
        if (err) {
            throw err;
        }
        paths.forEach(function(path) {
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                _srcClone = srcClone + '/' + path,
                readable, writable;
            stat(_src, function(err, st) {
                if (err) {
                    throw err;
                }

                exists(_srcClone, function(ext) {
                    if (st.isFile() && ext) {
                        // 创建读取流
                        readable = fs.createReadStream(_srcClone);
                        // 创建写入流
                        writable = fs.createWriteStream(_dst);
                        // 通过管道来传输流
                        readable.pipe(writable);
                    }
                })
            });
        });
    });
};
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function(dst, callback) {
    fs.exists(dst, function(exists) {
        // 已存在

        callback(!!exists);

    });
};


// 复制目录
if (src && srcClone && dst) {
    copy(src, srcClone, dst);
}


module.exports = {
    doCopy: copy
}