### create-leafer
[English](./README.en.md) | 简体中文

create-leafer 是一个用于快速创建[Leafer](https://www.leaferjs.com/)项目的命令行工具。
#### 安装
```bash
npm install -g create-leafer
```
#### 使用方法
##### 快速创建vue+leafer模版
```bash
npm create leafer vue-template
```
或
```bash
npx create-leafer vue-template
```
##### 快速创建LeaferX插件模版
```bash
npm create leafer plugin
```
或
```bash
npx create-leafer plugin
```
###### 选项说明
- project name : 创建的项目文件夹的名称
- package name : 你的`package`名称，输入值会写入到`package.json`中
- support platform : 多选你的项目支持的平台，输入值会写入到`rollup.config.js`中，从而影响构建产物