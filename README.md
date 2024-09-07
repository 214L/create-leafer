### create-leaferx
[English](./README.en.md) | 简体中文

create-leaferx 是一个用于快速创建[LeaferX](https://github.com/leaferjs/LeaferX)项目的命令行工具。
#### 安装
```bash
npm install -g create-leaferx
```
#### 使用方法
```bash
npm create leaferx
```
或
```bash
npx create-leaferx
```
#### 选项说明
- project name : 创建的项目文件夹的名称
- package name : 你的`package`名称，输入值会写入到`package.json`中
- support platform : 多选你的项目支持的平台，输入值会写入到`rollup.config.js`中，从而影响构建产物