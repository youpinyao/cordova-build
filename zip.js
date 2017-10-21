var fstream = require('fstream'),
  tar = require('tar'),
  zlib = require('zlib'),
  fs = require('fs');



function compress(projectPath, appName, buildPlatform, callback) {


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

  var fstr = fstream.Reader({
      'path': projectPath,
      'type': 'Directory',
      filter: function () {
        var path = this.path;

        if ((this.root.dirname + this.root.basename) == this.path) {
          return true;
        }

        var base = this.root.dirname + '/' + this.root.basename;

        var tools = base + '/tools';
        var svn = base + '/\.svn';
        var git = base + '/\.git';
        var dll = base + '/\.dll';
        var src = base + '/src';
        var plugins = base + '/plugins';
        var build = base + '/build';
        var hook = base + '/hook';
        var nodeModules = base + '/node_modules';
        var packageHooks = base + '/package-hooks';
        var platforms = base + '/platforms';
        var android = base + '/platforms/android';
        var ios = base + '/platforms/ios';
        var www = base + '/www';
        var configXml = base + '/config\.xml';
        var packageJson = base + '/package\.json';

        if ((new RegExp(svn, 'g')).test(this.path)) {
          return false;
        }
        if ((new RegExp(git, 'g')).test(this.path)) {
          return false;
        }
        if ((new RegExp(dll, 'g')).test(this.path)) {
          return false;
        }
        if ((new RegExp(tools, 'g')).test(this.path)) {
          return false;
        }
        if ((new RegExp(src, 'g')).test(this.path)) {
          return false;
        }
        // if ((new RegExp(plugins, 'g')).test(this.path)) {
        //   return false;
        // }

        process.stderr.write(`${this.path.split(base)[1]}`);
        process.stderr.clearLine();
        process.stderr.cursorTo(0);

        // console.log('dir: ' + this.root.dirname, 'base:' + this.root.basename, 'pp: ' + plugins);

        if (platforms == this.path) {
          return true;
        }

        if ((new RegExp(android, 'g')).test(this.path)) {
          if (buildPlatform == 'ios') {
            return false;
          }
          return true;
        }

        if ((new RegExp(ios, 'g')).test(this.path)) {
          if (buildPlatform == 'android') {
            return false;
          }
          return true;
        }

        return true;



      }
    }) /* Read the source directory */
    .pipe(tar.Pack()) /* Convert the directory to a .tar file */
    .pipe(zlib.Gzip()) /* Compress the .tar file */
    .pipe(fstream.Writer({
      'path': 'zip/' + appName + '_cordova_build_project.tar.gz'
    }))


  fstr.on('close', function () {

    console.log('zip close')

    typeof callback === 'function' && callback();
  })



}


module.exports = {
  compress: compress
};
