### create-leafer

English | [简体中文](./README.md)

`create-leafer` is a CLI tool for quickly creating [Leafer](https://www.leaferjs.com/) projects.

> If this project has been helpful to you, you're welcome to give it a Star ⭐️. Thank you for your support! Additionally, feel free to report bugs or share your suggestions through [issues](https://github.com/214L/create-leafer/issues) or other methods.

#### Usage

##### Quickly create a `Vue` + `Leafer` template project

This command will generate a `Vue3` + `TypeScript` + `Leafer` project template in the directory.

> While the global installation command is shorter, it is recommended to use `npm create leafer` to automatically use the latest version of create-leafer. If you choose to install globally, please update the plugins regularly to ensure you have the latest features and a more stable version.

```bash
npm create leafer@latest vue-template
```

##### Import `Leafer` to your project

This command will guide you through adding Leafer dependencies to your existing project interactively.

```bash
npm create leafer@latest init
```

##### Add or Remove Leafer Dependencies in Your Project

This command interactively modifies the necessary Leafer dependencies in your current project.

```bash
npm create leafer@latest add
```

##### Update Leafer Dependencies in the Project

This command will checks and updates the Leafer dependencies in your project.

```bash
npm create leafer@latest update
```

##### Quickly create a LeaferX plugin template

This command helps you generate a LeaferX project template for plugin or upper layer application development.

```bash
npm create leafer@latest plugin
```

#### Global Installation

You can also globally install `create-leafer` to use this tool.

```bash
npm install -g create-leafer@latest
```

Once installed globally, you can use the `create-leafer` or `leafer` command to run features:

```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
```
