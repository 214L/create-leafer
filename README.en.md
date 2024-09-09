### create-leafer
English | [简体中文](./README.md)

create-leafer is a cli tool that helps you to create project about Leafer.
#### Installation
```bash
npm install -g create-leafer
```
#### Usage
##### Quickly create leafer projects with Vue
```bash
npm create leafer vue-template
```
or
```bash
npx create-leafer vue-template
```
##### Quickly create leafer plugin project
```bash
npm create leafer plugin
```
or
```bash
npx create-leafer plugin
```
###### Options
- project name : naming the folder of the project
- package name : naming your package,this value will write to package.json
- support platform : multiple choose the platform you want to support.This value will write in rollup.config.js ,which affects the build product