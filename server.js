var fstream = require('fstream'),
  tar = require('tar'),
  zlib = require('zlib');
var exec = require('child_process').exec;

var os = require('os');

var fs = require('fs');

var xmlParse = require('xml-parser');

var hash = require('./hash.js');

var createDownload = require('mt-downloader').createDownload;

var process = require('process');
var currentPath = require('process').cwd();

var express = require('express');
var app = express();
var http = require('http');
var config = require('./config.js');

var errorIp = null;


process.on('uncaughtException', function (err) {
  //打印出错误
  console.log(err);
  //打印出错误的调用栈方便调试
  console.log(err.stack);

  returnError(err);
});


function returnError(msg) {

  if (/socket hang up/g.test(msg) || /ECONNREFUSED/g.test(msg) || /ETIMEDOUT/g.test(msg) || /ECONNRESET/g.test(msg)) {
    return;
  }
  console.log(errorIp + '---------' + msg);

  console.log('-------------------');


  errorIp && http.get('http://' + errorIp + '/error/' + encodeURIComponent(JSON.stringify(msg)));
}



console.log('os: ' + os.platform())

app.use('/zip', express.static('zip'));
app.use('/dist', express.static('dist'));

app.get('/upload/:path/:appName/:ip/:buildType/:buildPlatform', function (req, res) {


  var path = decodeURIComponent(req.params.path);
  var appName = decodeURIComponent(req.params.appName);
  var ip = decodeURIComponent(req.params.ip);
  var buildType = decodeURIComponent(req.params.buildType);
  var buildPlatform = decodeURIComponent(req.params.buildPlatform);

  errorIp = ip;

  console.log('upload ing ' + '[' + path + ']');


  var downloader = createDownload({
    path: appName + '_cordova_build_project.tar.gz',
    url: path
  });

  downloader.start().subscribe(function (e) {

    console.log('upload complete');
    res.send('upload complete');

    setTimeout(function () {

      if (fs.existsSync(currentPath + '/project/' + appName)) {
        console.log('remove project ing')
        exec('rm -R project/' + appName, {
          cwd: currentPath
        }, function (out, err) {
          err && console.log(err);
          console.log('remove project complete')
          doIt();
        })
      } else {
        doIt();
      }

      function doIt() {
        console.log('extract ing');


        fstream.Reader({
            'path': appName + '_cordova_build_project.tar.gz',
            'type': 'File'
          }) /* Read the source directory */
          .pipe(zlib.Unzip()) /* Compress the .tar file */
          .pipe(tar.Extract({
            path: currentPath + '/project'
          }).on('end', function () {
            console.log('extract complete');
            exec('rm ' + appName + '_cordova_build_project.tar.gz', function (err, out) {
              err && console.log(err);
              err && returnError(err);
            });

            var appPath = currentPath + '/project/' + appName;


            var hasIOS = fs.existsSync(currentPath + '/project/' + appName + '/platforms/ios');
            var hasAndroid = fs.existsSync(currentPath + '/project/' + appName + '/platforms/android');

            if (buildPlatform == 'android') {
              hasIOS = false;
            }
            if (buildPlatform == 'ios') {
              hasAndroid = false;
            }

            var provision_path = '/Library/MobileDevice/Provisioning Profiles';


            var obj = xmlParse(fs.readFileSync(appPath + '/config.xml', 'utf8'));

            var appVersion = obj && obj.root && obj.root.attributes ? obj.root.attributes.version : 'unkown-version';

            var buildName = undefined;
            var childrens = obj.root.children;

            for (var i = 0; i < childrens.length; i++) {
              if (childrens[i].name == 'name') {
                buildName = childrens[i].content;
              }
            }



            var debug_p12_path = appPath + '/build/debug.p12';
            var release_p12_path = appPath + '/build/release.p12';

            var debug_provision_path = appPath + '/build/debug.mobileprovision';
            var release_provision_path = appPath + '/build/release.mobileprovision';

            var has_debug_provision = fs.existsSync(debug_provision_path);
            var has_release_provision = fs.existsSync(release_provision_path);

            var has_debug_p12 = fs.existsSync(debug_p12_path);
            var has_release_p12 = fs.existsSync(release_p12_path);

            var has_provision_path = fs.existsSync(provision_path);

            if (!has_provision_path) {
              fs.mkdirSync(provision_path);
            }

            var ios_build_path = appPath + '/build/ios_build.json';

            var ios_build_json = {
              ios: {
                debug: {
                  codeSignIdentitiy: "",
                  provisioningProfile: ""
                },
                release: {
                  codeSignIdentitiy: "",
                  provisioningProfile: ""
                }
              }
            }


            function setDebugProvision(callback) {
              exec('openssl smime -inform der -verify -noverify -in "' + debug_provision_path + '"', function (err, out) {

                err && console.log(err);
                err && returnError(err);

                var content = out;
                var res = null;

                content = content.split('<key>UUID</key>')[1];
                content = content.split('<key>Version</key>')[0];
                content = content.trim();
                content = content.split('<string>')[1];
                content = content.split('</string>')[0];

                res = content;

                exec('cp -R "' + debug_provision_path + '" "' + provision_path + '/' + res + '.mobileprovision"', function (err, out) {
                  err && console.log(err);
                  err && returnError(err);

                  typeof callback === 'function' && callback(res);


                });
              });
            }

            function setReleaseProvision(callback) {
              exec('openssl smime -inform der -verify -noverify -in "' + release_provision_path + '"', function (err, out) {

                err && console.log(err);
                err && returnError(err);

                var content = out;
                var res = null;

                content = content.split('<key>UUID</key>')[1];
                content = content.split('<key>Version</key>')[0];
                content = content.trim();
                content = content.split('<string>')[1];
                content = content.split('</string>')[0];

                res = content;

                exec('cp -R "' + release_provision_path + '" "' + provision_path + '/' + res + '.mobileprovision"', function (err, out) {
                  err && console.log(err);
                  err && returnError(err);

                  typeof callback === 'function' && callback(res);

                });
              });
            }

            function setDebugP12(callback) {
              var key = fs.readFileSync(appPath + '/build/debug.p12.key', 'utf-8');
              key = key || '123456';
              exec('security import ' + debug_p12_path + ' -k /Library/Keychains/System.keychain -P ' + key + ' -T /usr/bin/codesign', function (err, out) {
                err && console.log(err);
                err && returnError(err);

                exec('keytool -list -v -keystore ' + debug_p12_path + ' -storepass ' + key + ' -storetype pkcs12', function (err, out) {

                  err && console.log(err);
                  err && returnError(err);

                  var content = out;
                  var jContent = {};

                  content = content.split('所有者:')[1];
                  content = content.split('发布者:')[0];
                  content = content.split(',');

                  content.forEach(function (item, index, full) {
                    var key = item.split('=')[0];
                    var value = item.split('=')[1];
                    jContent[key.trim()] = value.trim();
                  })

                  typeof callback === 'function' && callback(jContent.CN);

                })


              });
            }

            function setReleaseP12(callback) {
              var key = fs.readFileSync(appPath + '/build/release.p12.key', 'utf-8');
              key = key || '123456';
              exec('security import ' + release_p12_path + ' -k /Library/Keychains/System.keychain -P ' + (key || '123456') + ' -T /usr/bin/codesign', function (err, out) {
                err && console.log(err);
                err && returnError(err);

                exec('keytool -list -v -keystore ' + release_p12_path + ' -storepass ' + key + ' -storetype pkcs12', function (err, out) {

                  err && console.log(err);
                  err && returnError(err);

                  var content = out;
                  var jContent = {};

                  content = content.split('所有者:')[1];
                  content = content.split('发布者:')[0];
                  content = content.split(',');

                  content.forEach(function (item, index, full) {
                    var key = item.split('=')[0];
                    var value = item.split('=')[1];
                    jContent[key.trim()] = value.trim();
                  })

                  typeof callback === 'function' && callback(jContent.CN);

                })
              });

            }


            if (hasIOS) {
              if (buildType == 'release' && has_release_provision && has_release_p12) {

                setReleaseP12(function (res) {

                  ios_build_json.ios.release.codeSignIdentitiy = res;

                  setReleaseProvision(function (res) {

                    ios_build_json.ios.release.provisioningProfile = res;

                    fs.writeFileSync(ios_build_path, JSON.stringify(ios_build_json));

                    doBuild();

                  })

                })

                return;

              } else if (buildType == 'debug' && has_debug_provision && has_debug_p12) {

                setDebugP12(function (res) {

                  ios_build_json.ios.debug.codeSignIdentitiy = res;

                  setDebugProvision(function (res) {

                    ios_build_json.ios.debug.provisioningProfile = res;

                    fs.writeFileSync(ios_build_path, JSON.stringify(ios_build_json));

                    doBuild();

                  })

                })

                return;

              }
            }


            doBuild();

            function doBuild() {


              // console.log('prepare ing');
              // exec('ionic prepare', {
              // 	cwd: appPath
              // }, function(err, out) {
              // 	err && console.log(err);
              // 	err && returnError(err);

              // 	console.log('prepare complete');


              exec('chmod -R 777 ./project/' + appName, {
                cwd: currentPath
              }, function (err, out) {
                err && console.log(err);
                err && returnError(err);

                if (hasIOS) {
                  console.log('ios build ' + buildType + ' ing');

                  exec('cordova build ios ' + (buildType == 'release' ? '--release ' : '') + '--device' + ' --buildConfig ./build/ios_build.json', {
                    cwd: appPath,
                    maxBuffer: 5000 * 1024
                  }, function (err, out) {
                    err && console.log(err);
                    err && returnError(err);

                    console.log('ios build ' + buildType + ' complete');

                    // fs.mkdir(appPath + '/platforms/ios/build/device/ipa', function() {
                    // 	fs.mkdir(appPath + '/platforms/ios/build/device/ipa/PayLoad', function() {
                    // 		fs.mkdir(appPath + '/platforms/ios/build/device/ipa/PayLoad/' + buildName + '.app', function() {
                    // 			fs.mkdir(appPath + '/platforms/ios/build/device/ipa/SwiftSupport', function() {
                    // 				exec('node copy ' + appPath + '/platforms/ios/build/device/' + buildName + '.app ' + appPath + '/platforms/ios/build/device/ipa/PayLoad/' + buildName + '.app', {
                    // 					cwd: currentPath,
                    // 					maxBuffer: 5000 * 1024
                    // 				}, function(err, out) {
                    // 					err && console.log(err);
                    // 					err && returnError(err);
                    // 					exec('node copy ' + appPath + '/platforms/ios/build/device/' + buildName + '.app/Frameworks ' + appPath + '/platforms/ios/build/device/ipa/SwiftSupport', {
                    // 						cwd: currentPath,
                    // 						maxBuffer: 5000 * 1024
                    // 					}, function(err, out) {
                    // 						err && console.log(err);
                    // 						err && returnError(err);

                    // 						exec('zip --symlinks --verbose --recurse-paths "' + currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa" ./', {
                    // 							cwd: appPath + '/platforms/ios/build/device/ipa',
                    // 							maxBuffer: 5000 * 1024
                    // 						}, function(err, out) {
                    // 							err && console.log(err);
                    // 							err && returnError(err);

                    // 							console.log('ios download ing');

                    // 							hasIOS = false;

                    // 							// !hasIOS && !hasAndroid && fs.existsSync(currentPath + '/project/' + appName) &&
                    // 							// 	exec('rm -R project/' + appName, {
                    // 							// 		cwd: currentPath
                    // 							// 	}, function(out, err) {
                    // 							// 		err && console.log(err);

                    // 							// 	});

                    // 							http.get('http://' + ip + '/download/' + encodeURIComponent('http://' + config.SIP + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa') + '/ios', function() {

                    // 								console.log('ios download complete');
                    // 								!hasAndroid && !hasIOS && console.log('----------------------------');
                    // 							})
                    // 						})


                    // 					});

                    // 				});

                    // 			});
                    // 		});
                    // 	});
                    // });
                    //
                    //

                    //currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa'

                    exec('/usr/bin/xcrun -sdk iphoneos PackageApplication -v ' + appPath + '/platforms/ios/build/device/*.app -o ' + currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa', {
                      cwd: appPath,
                      maxBuffer: 5000 * 1024
                    }, function (err, out) {

                      err && console.log(err);
                      err && returnError(err);
                      console.log('ios download ing');



                      exec('unzip -o ' + currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa -d ./' + appName, {
                        cwd: appPath + '/platforms/ios/build/device',
                        maxBuffer: 5000 * 1024
                      }, function (err, out) {
                        err && console.log(err);
                        err && returnError(err);

                        fs.mkdir(appPath + '/platforms/ios/build/device/' + appName + '/SwiftSupport', function () {


                          function zipApp() {
                            exec('zip --symlinks --verbose --recurse-paths ' + currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa ./', {
                              cwd: appPath + '/platforms/ios/build/device/' + appName,
                              maxBuffer: 5000 * 1024
                            }, function (err, out) {
                              err && console.log(err);
                              err && returnError(err);


                              hasIOS = false;

                              // !hasIOS && !hasAndroid && fs.existsSync(currentPath + '/project/' + appName) &&
                              // 	exec('rm -R project/' + appName, {
                              // 		cwd: currentPath
                              // 	}, function(out, err) {
                              // 		err && console.log(err);

                              // 	});


                              //下载dSYM
                              exec('zip --symlinks --verbose --recurse-paths ' + currentPath + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.dsym ./', {
                                cwd: appPath + '/platforms/ios/build/device/' + buildName + '.app.dSYM',
                                maxBuffer: 5000 * 1024
                              }, function (err, out) {
                                err && console.log(err);
                                err && returnError(err);

                                console.log('dSYM download ing');

                                http.get('http://' + ip + '/download/' + encodeURIComponent('http://' + config.SIP + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.dsym') + '/dsym', function () {

                                  console.log('dSYM download complete');
                                  console.log('----------------------------');


                                  http.get('http://' + ip + '/download/' + encodeURIComponent('http://' + config.SIP + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.ipa') + '/ios', function () {

                                    console.log('ios download complete');
                                    !hasAndroid && !hasIOS && console.log('----------------------------');
                                  })
                                })

                              })



                            })
                          }

                          fs.exists(appPath + '/platforms/ios/build/device/' + buildName + '.app/Frameworks', function (ext) {
                            if (ext) {
                              exec('node copySame ' + appPath + '/platforms/ios/build/device/' + buildName + '.app/Frameworks /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphoneos ' + appPath + '/platforms/ios/build/device/' + appName + '/SwiftSupport', {
                                cwd: currentPath,
                                maxBuffer: 5000 * 1024
                              }, function (err, out) {
                                err && console.log(err);
                                err && returnError(err);
                                zipApp();

                              });
                            } else {
                              zipApp();
                            }
                          })


                        });

                      })

                    })

                  })

                }
                if (hasAndroid) {

                  console.log('android build ' + buildType + ' ing');

                  exec('cordova build android ' + (buildType == 'release' ? '--release ' : '') + '--buildConfig ./build/android_build.json', {
                    cwd: appPath,
                    maxBuffer: 5000 * 1024
                  }, function (err, out) {
                    err && console.log(err);
                    err && returnError(err);


                    console.log('android build ' + buildType + ' complete');

                    exec('cp -R platforms/android/build/outputs/apk/android-' + buildType + '.apk ../../dist/' + appName + '-' + buildType + '-' + appVersion + '.apk', {
                      cwd: appPath
                    }, function (err, out) {
                      err && console.log(err);
                      err && returnError(err);

                      console.log('android download ing');

                      hasAndroid = false;

                      // !hasIOS && !hasAndroid && fs.existsSync(currentPath + '/project/' + appName) &&
                      // 	exec('rm -R project/' + appName, {
                      // 		cwd: currentPath
                      // 	}, function(out, err) {
                      // 		err && console.log(err);

                      // 	});

                      http.get('http://' + ip + '/download/' + encodeURIComponent('http://' + config.SIP + '/dist/' + appName + '-' + buildType + '-' + appVersion + '.apk') + '/android', function () {

                        console.log('android download complete');
                        !hasAndroid && !hasIOS && console.log('----------------------------');
                      })


                    });
                  })

                }

              })
              // })
            }


          }))


      }



    }, 1000)
  });


});

var server = app.listen(config.SPORT, function () {
  console.log('listening at http://%s', config.SIP);
});
