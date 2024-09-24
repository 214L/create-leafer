### create-leafer

English | [简体中文](./README.md)

`create-leafer` is a CLI tool for quickly creating [Leafer](https://www.leaferjs.com/) projects.

> If this project has been helpful to you, you're welcome to give it a Star ⭐️. Thank you for your support! Additionally, feel free to report bugs or share your suggestions through [issues](https://github.com/214L/create-leafer/issues) or other methods.

#### Usage

##### Quickly Create a `Vue` + `Leafer` Template Project

Running this command will generate a `Vue3` + `TypeScript` + `Leafer` project template in the current directory, designed for quickly building a Leafer experience environment.

```bash
npm create leafer@latest vue-template
```

##### Import `Leafer` in Your Project

This command will interactively import Leafer dependencies into the current project‘s package.json.

```bash
npm create leafer@latest init
```

You need to run this command in a project (where a `package.json` file exists). It's recommended to first build your project using build tools like `vite` or `webpack`, and then use this command to smoothly import `leafer` dependencies.

##### Add or Remove Leafer Dependencies in Your Project

Modify the Leafer dependencies in the current project.

```bash
npm create leafer@latest add
```

This command will interactively modify the Leafer dependencies in the current project. The project must include Leafer-related dependencies.

##### Update Leafer Dependencies version in Your Project‘s `package.json`

Check and update Leafer dependencies version number in your package.json.

```bash
npm create leafer@latest update
```

This command will read all `Leafer` dependencies in the project, fetch the latest version of Leafer, and modify the relevant version numbers in `package.json`. After completion, you need to run the installation command of your package manager to install the dependencies. If errors occur due to old version cache conflicts, you may need to delete the lock file and reinstall.

##### Quickly Create a LeaferX Plugin Template

This command helps you generate a LeaferX project template for plugin or upper layer application development.

```bash
npm create leafer@latest plugin
```

For more details, see [Plugin Development](https://www.leaferjs.com/ui/plugin/dev.html).

#### Global Installation

You can also globally install `create-leafer` to use this tool.

> While global installation offers shorter commands, it is recommended to use `npm create leafer@latest` to automatically use the latest version of create-leafer. If you choose to install globally, please keep it updated to access the latest features and more stable versions.

```bash
npm install -g create-leafer@latest
```

After global installation, you can run functionalities using the `create-leafer` or `leafer` commands:

```bash
npx leafer vue-template
npx leafer init
npx leafer plugin
...
```
