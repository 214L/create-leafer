#!/usr/bin/env node

import { execSync, spawn } from 'child_process'
import { existsSync, rmSync, readFileSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const testDir = resolve(projectRoot, '.test-templates')
const cliPath = resolve(projectRoot, 'create-leafer.cjs')

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

// 测试配置
const templates = [
  { name: 'vanilla-js', framework: 'Vanilla', variant: 'JavaScript', hasViteConfig: true, hasTS: false },
  { name: 'vanilla-ts', framework: 'Vanilla', variant: 'TypeScript', hasViteConfig: true, hasTS: true },
  { name: 'vue-js', framework: 'Vue', variant: 'JavaScript', hasViteConfig: true, hasTS: false },
  { name: 'vue-ts', framework: 'Vue', variant: 'TypeScript', hasViteConfig: true, hasTS: true },
  { name: 'react-js', framework: 'React', variant: 'JavaScript', hasViteConfig: true, hasTS: false },
  { name: 'react-ts', framework: 'React', variant: 'TypeScript', hasViteConfig: true, hasTS: true }
]

let passedTests = 0
let failedTests = 0
const errors = []

console.log(colors.bold('\n🧪 开始自动化测试所有模板...\n'))

// 清理测试目录
if (existsSync(testDir)) {
  rmSync(testDir, { recursive: true, force: true })
}

// 创建测试项目
function createProject(template) {
  return new Promise((resolve, reject) => {
    const projectName = `test-${template.name}`
    const projectPath = join(testDir, projectName)

    console.log(colors.blue(`\n📦 测试 ${template.name} 模板...`))

    // 使用 spawn 创建项目
    const child = spawn('node', [cliPath, 'template'], {
      cwd: testDir,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let errorOutput = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    // 按顺序输入响应
    setTimeout(() => child.stdin.write(`${projectName}\n`), 500)
    setTimeout(() => child.stdin.write('\n'), 1000)  // 选择框架 (使用默认/第一个)
    setTimeout(() => {
      // 根据 framework 选择
      if (template.framework === 'Vanilla') {
        child.stdin.write('\n')  // 选择 Vanilla (默认)
      } else if (template.framework === 'Vue') {
        child.stdin.write('\x1B[B\n')  // 向下选择 Vue
      } else if (template.framework === 'React') {
        child.stdin.write('\x1B[B\x1B[B\n')  // 向下两次选择 React
      }
    }, 1500)

    setTimeout(() => {
      // 选择 variant
      if (template.variant === 'TypeScript') {
        child.stdin.write('\n')  // TypeScript 是第一个
      } else {
        child.stdin.write('\x1B[B\n')  // JavaScript 是第二个
      }
    }, 2500)

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`创建失败,退出码: ${code}\n${errorOutput}`))
      } else {
        resolve({ projectPath, output })
      }
    })

    setTimeout(() => {
      child.kill()
      reject(new Error('创建超时'))
    }, 10000)
  })
}

// 验证项目
function verifyProject(template, projectPath) {
  const checks = []

  // 1. 验证目录存在
  if (!existsSync(projectPath)) {
    checks.push({ name: '目录存在', passed: false, error: '项目目录不存在' })
    return checks
  }
  checks.push({ name: '目录存在', passed: true })

  // 2. 验证 vite.config 文件
  const viteConfigExt = template.hasTS ? 'ts' : 'js'
  const viteConfigPath = join(projectPath, `vite.config.${viteConfigExt}`)
  const hasViteConfig = existsSync(viteConfigPath)
  checks.push({
    name: 'vite.config 存在',
    passed: hasViteConfig,
    error: hasViteConfig ? null : `缺少 vite.config.${viteConfigExt}`
  })

  // 3. 验证 package.json
  const packageJsonPath = join(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    checks.push({ name: 'package.json 存在', passed: false, error: '缺少 package.json' })
    return checks
  }
  checks.push({ name: 'package.json 存在', passed: true })

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  // 4. 验证依赖分类 (只检查 vanilla 模板)
  if (template.name.startsWith('vanilla')) {
    const hasLeaferInDeps = packageJson.dependencies && 'leafer-ui' in packageJson.dependencies
    checks.push({
      name: 'Leafer 在 dependencies',
      passed: hasLeaferInDeps,
      error: hasLeaferInDeps ? null : 'Leafer 包应该在 dependencies 中'
    })
  }

  // 5. 验证版本号格式
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const leaferDeps = Object.entries(deps).filter(([name]) =>
    name.includes('leafer') || name.startsWith('@leafer')
  )

  const allUseCaretVersion = leaferDeps.every(([name, version]) =>
    version.startsWith('^1.12.2')
  )
  checks.push({
    name: '版本号格式正确 (^1.12.2)',
    passed: allUseCaretVersion,
    error: allUseCaretVersion ? null : `某些 Leafer 包版本不是 ^1.12.2: ${JSON.stringify(leaferDeps)}`
  })

  return checks
}

// 测试构建
function testBuild(projectPath) {
  return new Promise((resolve) => {
    console.log(colors.yellow('  📦 安装依赖...'))
    try {
      execSync('npm install', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 120000  // 2分钟超时
      })
      console.log(colors.green('  ✓ 依赖安装成功'))
    } catch (error) {
      resolve({ name: 'npm install', passed: false, error: error.message })
      return
    }

    console.log(colors.yellow('  🔨 运行构建...'))
    try {
      execSync('npm run build', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 60000  // 1分钟超时
      })
      console.log(colors.green('  ✓ 构建成功'))
      resolve({ name: 'npm run build', passed: true })
    } catch (error) {
      resolve({ name: 'npm run build', passed: false, error: error.message })
    }
  })
}

// 主测试流程
async function runTests() {
  for (const template of templates) {
    try {
      // 创建项目 (简化版:直接复制模板)
      const projectName = `test-${template.name}`
      const projectPath = join(testDir, projectName)

      console.log(colors.blue(`\n📦 测试 ${template.name} 模板...`))

      // 直接使用内部 API 创建项目
      const templatePath = template.name.replace('-', '/')
      const sourceTemplate = resolve(projectRoot, 'template', 'leafer', templatePath)

      if (!existsSync(testDir)) {
        execSync(`mkdir -p "${testDir}"`)
      }

      // 复制模板
      execSync(`cp -r "${sourceTemplate}" "${projectPath}"`)

      // 验证项目
      const checks = verifyProject(template, projectPath)

      // 输出验证结果
      checks.forEach(check => {
        if (check.passed) {
          console.log(colors.green(`  ✓ ${check.name}`))
          passedTests++
        } else {
          console.log(colors.red(`  ✗ ${check.name}: ${check.error}`))
          failedTests++
          errors.push({ template: template.name, check: check.name, error: check.error })
        }
      })

      // 测试构建 (可选,太慢可以跳过)
      const buildResult = await testBuild(projectPath)
      if (buildResult.passed) {
        console.log(colors.green(`  ✓ ${buildResult.name}`))
        passedTests++
      } else {
        console.log(colors.red(`  ✗ ${buildResult.name}: ${buildResult.error}`))
        failedTests++
        errors.push({ template: template.name, check: buildResult.name, error: buildResult.error })
      }

      console.log(colors.green(`\n  ✅ ${template.name} 测试完成\n`))

    } catch (error) {
      console.log(colors.red(`  ✗ 测试失败: ${error.message}\n`))
      failedTests++
      errors.push({ template: template.name, error: error.message })
    }
  }

  // 清理测试目录
  console.log(colors.yellow('\n🧹 清理测试文件...\n'))
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true })
  }

  // 输出总结
  console.log(colors.bold('\n' + '='.repeat(60)))
  console.log(colors.bold('📊 测试结果总结\n'))
  console.log(`  通过: ${colors.green(passedTests)} 个测试`)
  console.log(`  失败: ${colors.red(failedTests)} 个测试\n`)

  if (errors.length > 0) {
    console.log(colors.bold(colors.red('❌ 失败详情:\n')))
    errors.forEach(error => {
      console.log(colors.red(`  • [${error.template}] ${error.check || 'Error'}: ${error.error}`))
    })
    console.log()
    process.exit(1)
  } else {
    console.log(colors.bold(colors.green('✅ 所有测试通过!\n')))
    console.log(colors.bold('='.repeat(60) + '\n'))
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error(colors.red(`\n❌ 测试过程出错: ${error.message}\n`))
  process.exit(1)
})
