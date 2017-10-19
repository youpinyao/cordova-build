var fstream = require('fstream'),
	tar = require('tar'),
	zlib = require('zlib');
var exec = require('child_process').exec;

var moment = require('moment');

var os = require('os');

var fs = require('fs');

var createDownload = require('mt-downloader').createDownload;

var process = require('process');
var currentPath = require('process').cwd();

var express = require('express');
var app = express();
var http = require('http');


var zip = require('./zip.js');
var upload = require('./upload.js');

var hasIOS = hasAndroid = false;

var config = require('./config.js');

process.on('uncaughtException', function(err) {
	//打印出错误
	console.log(err);
	//打印出错误的调用栈方便调试
	console.log(err && err.stack);

	// process.exit();
	console.log('-------------------');
});



console.log('os: ' + os.platform())

app.use('/zip', express.static('zip'));
app.use('/dist', express.static('dist'));


app.get('/error/:msg', function(req, res) {
	var msg = decodeURIComponent(req.params.msg);

	console.log(msg);
	setTimeout(function() {
		process.exit();
	}, 1000)

})


app.get('/download/:path/:platform', function(req, res) {


	var path = decodeURIComponent(req.params.path);
	var platform = decodeURIComponent(req.params.platform);

	console.log(platform + ' build complete');
	console.log(platform + ' download ing' + '[' + path + ']');

	var fileName = path.split('/');
	var currentDate = moment().format('YYYY-MM-DD-hh-mm-ss');

	fileName = fileName[fileName.length - 1];

	if (/\.ipa/g.test(fileName)) {
		fileName = fileName.split('.ipa');
		fileName[0] = fileName[0] + '-' + currentDate;
		fileName = fileName.join('.ipa');
	}
	if (/\.apk/g.test(fileName)) {
		fileName = fileName.split('.apk');
		fileName[0] = fileName[0] + '-' + currentDate;
		fileName = fileName.join('.apk');
	}

	if (/\.dsym/g.test(fileName)) {
		fileName = fileName.split('.dsym');
		fileName[0] = fileName[0] + '-' + currentDate;
		fileName = fileName.join('.dsym');
	}

	var downloader = createDownload({
		path: 'dist/' + fileName,
		url: path
	});

	downloader.start().subscribe(function(e) {

		console.log(platform + ' download complete');
		console.log(platform + ' path: dist/' + fileName);

		res.send(platform + ' download complete');

		setTimeout(function() {
			if (platform == 'android') {
				hasAndroid = false;
			};
			if (platform == 'ios') {
				hasIOS = false;
			};

			!hasIOS && !hasAndroid && process.exit();
		}, 1000)

	});

});



var server = app.listen(config.UPORT, function() {
	console.log('listening at http://%s', config.UIP);

	var arguments = process.argv.splice(2);
	var projectPath = arguments[0];
	var buildType = arguments[1];
	var buildPlatform = arguments[2];
	var appName = null;

	if (!buildPlatform) {
		buildPlatform = 'all'
	}

	if (!projectPath) {
		console.log('please set projectPath')
		process.exit();
	}


	buildType = buildType == 'release' ? 'release' : 'debug';

	hasIOS = fs.existsSync(projectPath + '/platforms/ios');
	hasAndroid = fs.existsSync(projectPath + '/platforms/android');

	if (buildPlatform == 'android') {
		hasIOS = false;
	}
	if (buildPlatform == 'ios') {
		hasAndroid = false;
	}


	if (!appName) {
		if (/\//g.test(projectPath)) {
			appName = projectPath.split('/');
			if (!appName[appName.length - 1]) {
				appName = appName[appName.length - 2];
			} else {
				appName = appName[appName.length - 1];
			}

		}
		if (/\\/g.test(projectPath)) {
			appName = projectPath.split('\\');
			if (!appName[appName.length - 1]) {
				appName = appName[appName.length - 2];
			} else {
				appName = appName[appName.length - 1];
			}

		}


		if (!/\//g.test(projectPath) && !/\\/g.test(projectPath)) {
			appName = projectPath;
		}

	}

	if (!appName) {
		appName = +new Date();
	}


	console.log('prepare ing');

	exec('ionic prepare', {
		cwd: projectPath
	}, function(err, out) {
		err && console.log(err);

		console.log('prepare complete');

		console.log('zip ing');


		zip.compress(projectPath, appName, buildPlatform, function() {
			console.log('zip complete');
			// process.exit();
			
			upload.progress(appName, buildType, buildPlatform, function() {
				console.log('build ing');
			});

		})
	})



});