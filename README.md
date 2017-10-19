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

## 启动服务

``` ndoe
node server
```

## 构建

``` node
node build <projectPath> <buildType> <platform>

node build ../ionicDemo debug ios

platform 选填
```