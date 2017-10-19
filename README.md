# 说明

## 安卓重新签名

``` sh
jarsigner -verbose -keystore release.keystore -signedjar yxjapp_distribution-release-1.1.70-2016-09-19-11-00-47.encrypted_signed.apk yxjapp_distribution-release-1.1.70-2016-09-19-11-00-47.encrypted.apk release

//最后一个为别名
```

## 配置修改

```node
在config.js 下修改，ip 地址，端口
```

## 环境要求

```node
sudo i //管理员权限
node // node 环境
ios-deploy // 已经安装 npm install -g ios-deploy --unsafe-perm=true

export ANDROID_HOME=/User/youpinyao/ADT
export PATH=${PATH}:${ANDROID_HOME}/tools
export PATH=${PATH}:${ANDROID_HOME}/platform-tools
```

## 启动服务

``` ndoe
npm run server
```

## 构建

``` node
npm run build <projectPath> <buildType> <platform>

npm run build ../ionicDemo debug ios

platform 选填
```