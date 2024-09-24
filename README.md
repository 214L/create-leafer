### create-leafer

[English](./README.en.md) | 简体中文

create-leafer 是一个用于快速创建[Leafer](https://www.leaferjs.com/)项目的命令行工具。

> 如果这个项目对你有帮助，请给它一个 star :star: ，谢谢你的支持！欢迎通过 [issue](https://github.com/214L/create-leafer/issues) 或其他方式反馈 Bug 或提供改进意见。

#### 使用方法

##### 快速创建 `Vue` + `Leafer` 模版项目

运行本命令会在当前目录下生成一个 `Vue3` + `TypeScript` + `Leafer` 的项目模板，用于快速构建 leafer 体验环境。

```bash
npm create leafer@latest vue-template
```

##### 在项目中引入 `Leafer`

该命令会以引导交互的方式在当前的项目中引入 leafer 依赖。

```bash
npm create leafer@latest init
```

需要在一个项目（目录下有 package.json 文件）中运行本命令，推荐先使用`vite`或`webpack`等构建工具先自由的配置你的项目环境，再使用本命令丝滑引入`leafer`依赖。

##### 添加或删除项目中的 leafer 依赖

修改当前项目中的 leafer 依赖。

```bash
npm create leafer@latest add
```

该命令会以引导交互的方式添加或删除当前项目中需要的 leafer 依赖。运行的项目中需要包含 leafer 相关依赖。

##### 更新项目中的 leafer 依赖版本号

检查并更新项目中的 leafer 依赖版本号。

```bash
npm create leafer@latest update
```

本命令会读取本项目所有 leafer 相关的依赖，同时获取 leafer 的最新版本，修改 package.json 中相关的版本号。
运行完成后，需要执行包管理器的安装命令安装依赖，如出现旧版本缓存冲突导致的报错，需要删除 lock 文件重新安装。

##### 快速创建 LeaferX 插件模版

该命令会帮助你生成一个 LeaferX 的项目模板，供插件/上层应用开发。

```bash
npm create leafer@latest plugin
```

详见[插件开发](https://www.leaferjs.com/ui/plugin/dev.html)。

#### 全局安装

你也可以全局安装 create-leafer 来使用本工具。

> 全局安装虽然命令更简短，但是更推荐使用`npm create leafer@latest`的方式自动使用最新的 create-leafer 版本。如果使用全局安装，请及时更新以使用最新特性和更稳定的版本。

```bash
npm install -g create-leafer@latest
```

全局安装后，可以使用`create-leafer`或者`leafer`命令来运行功能

```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
...
```
