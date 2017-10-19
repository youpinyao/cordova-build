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


        if (/\.svn/g.test(path)) {
          return false;
        }

        if ((this.root.dirname + this.root.basename) == this.path) {
          return true;
        }


        var git = this.root.dirname + this.root.basename + '\\\.git';
        var plugins = this.root.dirname + this.root.basename + '\\plugins';
        var build = this.root.dirname + this.root.basename + '\\build';
        var hook = this.root.dirname + this.root.basename + '\\hook';
        var nodeModules = this.root.dirname + this.root.basename + '\\node_modules';
        var packageHooks = this.root.dirname + this.root.basename + '\\package-hooks';
        var platforms = this.root.dirname + this.root.basename + '\\platforms';
        var android = this.root.dirname + this.root.basename + '\\platforms\\android';
        var ios = this.root.dirname + this.root.basename + '\\platforms\\ios';
        var www = this.root.dirname + this.root.basename + '\\www';
        var configXml = this.root.dirname + this.root.basename + '\\config\.xml';
        var packageJson = this.root.dirname + this.root.basename + '\\package\.json';


        git = git.replace(/\\/g, '\\\\');
        plugins = plugins.replace(/\\/g, '\\\\');
        build = build.replace(/\\/g, '\\\\');
        hook = hook.replace(/\\/g, '\\\\');
        nodeModules = nodeModules.replace(/\\/g, '\\\\');
        packageHooks = packageHooks.replace(/\\/g, '\\\\');
        // platforms = platforms.replace(/\\/g, '\\\\');
        android = android.replace(/\\/g, '\\\\');
        ios = ios.replace(/\\/g, '\\\\');
        www = www.replace(/\\/g, '\\\\');
        configXml = configXml.replace(/\\/g, '\\\\');
        packageJson = packageJson.replace(/\\/g, '\\\\');


        console.log(this.path);

        if ((new RegExp(git, 'g')).test(this.path)) {
          return false;
        }
        if ((new RegExp(plugins, 'g')).test(this.path)) {
          return false;
        }

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
