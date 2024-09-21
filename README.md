### create-leafer

[English](./README.en.md) | 简体中文

create-leafer 是一个用于快速创建[Leafer](https://www.leaferjs.com/)项目的命令行工具。
> 如果这个项目对你有帮助，欢迎给它一个 star :star: ，谢谢你的支持！  同时，欢迎通过 [issue](https://github.com/214L/create-leafer/issues) 或其他方式反馈 Bug 或提供改进意见。


#### 使用方法

##### 快速创建 `Vue` + `Leafer` 模版项目
该命令会在当前目录下生成一个`Vue3`+`TypeScript`+`Leafer`的项目模板。
```bash
npm create leafer vue-template
```

##### 在项目中引入 `Leafer`
该命令会以引导交互的方式在当前的项目中引入leafer依赖。
```bash
npm create leafer init
```

##### 快速创建 LeaferX 插件模版
该命令会帮助你生成一个LeaferX的项目模板，供插件/上层应用开发。
```bash
npm create leafer plugin
```

#### 全局安装

你也可以使用全局安装 create-leafer 来使用本工具

```bash
npm install -g create-leafer
```
全局安装后，可以使用`create-leafer`或者`leafer`命令来运行功能
```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
```