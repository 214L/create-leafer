### create-leafer

[English](./README.en.md) | 简体中文

create-leafer 是一个用于快速创建[Leafer](https://www.leaferjs.com/)项目的命令行工具。

> 如果这个项目对你有帮助，请给它一个 star :star: ，谢谢你的支持！欢迎通过 [issue](https://github.com/214L/create-leafer/issues) 或其他方式反馈 Bug 或提供改进意见。

#### 使用方法

##### 快速创建 `Vue` + `Leafer` 模版项目

该命令会在当前目录下生成一个`Vue3`+`TypeScript`+`Leafer`的项目模板。

```bash
npm create leafer@latest vue-template
```

##### 在项目中引入 `Leafer`

该命令会以引导交互的方式在当前的项目中引入 leafer 依赖。

```bash
npm create leafer@latest init
```

##### 添加或删除项目中的 leafer 依赖

该命令会以引导交互的方式修改当前项目中需要的 leafer 依赖。

```bash
npm create leafer@latest add
```


##### 更新项目中的 leafer 依赖

该命令会检查并更新项目中的 leafer 依赖。

```bash
npm create leafer@latest update
```

##### 快速创建 LeaferX 插件模版

该命令会帮助你生成一个 LeaferX 的项目模板，供插件/上层应用开发。

```bash
npm create leafer@latest plugin
```

#### 全局安装

你也可以使用全局安装 create-leafer 来使用本工具。
> 全局安装虽然命令更简短，但是更推荐使用`npm create leafer`的方式自动使用最新的create-leafer版本。如果使用全局安装，请及时更新以使用最新特性和更稳定的版本。

```bash
npm install -g create-leafer@latest
```

全局安装后，可以使用`create-leafer`或者`leafer`命令来运行功能

```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
```
