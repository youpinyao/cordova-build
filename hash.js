// generate a hash from file stream
var crypto = require('crypto'),
	fs = require('fs'),
	key = '123456';

module.exports = function(path, callback) {
	// open file stream
	var fstream = fs.createReadStream(path);
	var hash = crypto.createHash('md5', key);
	hash.setEncoding('hex');

	// once the stream is done, we read the values
	fstream.on('end', function() {
		hash.end();
		typeof callback === 'function' && callback(hash.read());
	});

	// pipe file to hash generator
	fstream.pipe(hash);
}