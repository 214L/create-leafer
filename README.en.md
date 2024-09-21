### create-leafer

[English](./README.en.md) | 简体中文

`create-leafer` is a CLI tool for quickly creating [Leafer](https://www.leaferjs.com/) projects.

> If this project has been helpful to you, you're welcome to give it a Star ⭐️. Thank you for your support! Additionally, feel free to report bugs or share your suggestions through [issues](https://github.com/214L/create-leafer/issues) or other methods.

#### Usage

##### Quickly create a `Vue` + `Leafer` template project
This command will generate a `Vue3` + `TypeScript` + `Leafer` project template in the directory.
```bash
npm create leafer vue-template
```

##### Import `Leafer` to your project
This command will guide you through adding Leafer dependencies to your existing project interactively.
```bash
npm create leafer init
```

##### Quickly create a LeaferX plugin template
This command helps you generate a LeaferX project template for plugin or application development.
```bash
npm create leafer plugin
```

#### Global Installation

You can also globally install `create-leafer` to use this tool.

```bash
npm install -g create-leafer
```

Once installed globally, you can use the `create-leafer` or `leafer` command to run features:
```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
```