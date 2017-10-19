var http = require('http');
var exec = require('child_process').exec;
var os = require('os');
var config = require('./config.js');

var process = require('process');


module.exports.progress = function(appName, buildType, buildPlatform, callback) {

	buildType = buildType == 'release' ? 'release' : 'debug';
	buildPlatform = buildPlatform || 'all';

	console.log('upload ing');
	http.get('http://' + config.SIP + '/upload/' + encodeURIComponent('http://' + config.UIP + '/zip/' + appName + '_cordova_build_project.tar.gz') + '/' + appName + '/' + config.UIP + '/' + buildType + '/' + buildPlatform, function() {
		console.log('upload complete');


		typeof callback === 'function' && callback();

		if (os.platform() == 'win32') {

			exec('del zip\\' + appName + '_cordova_build_project.tar.gz', function(err, out) {
				err && console.log(err);
			});
		} else {
			exec('rm zip/' + appName + '_cordova_build_project.tar.gz', function(err, out) {
				err && console.log(err);
			});
		}
	})
}