import fs from 'node:fs'
function rgbGradient(startRgb, endRgb, steps) {
  const gradient: Array<Array<number>> = []
  for (let i = 0; i < steps; i++) {
    const r = Math.round(
      startRgb[0] + ((endRgb[0] - startRgb[0]) * i) / (steps - 1)
    )
    const g = Math.round(
      startRgb[1] + ((endRgb[1] - startRgb[1]) * i) / (steps - 1)
    )
    const b = Math.round(
      startRgb[2] + ((endRgb[2] - startRgb[2]) * i) / (steps - 1)
    )
    gradient.push([r, g, b])
  }
  console.log(gradient)

  return gradient
}

function generateAnsiGradientText(text, startColor, endColor) {
  const steps = text.length
  const startRgb = startColor.match(/\d+/g).map(Number)
  const endRgb = endColor.match(/\d+/g).map(Number)
  const gradientColors = rgbGradient(startRgb, endRgb, steps)
  let ansiText = ''

  for (let i = 0; i < text.length; i++) {
    const [r, g, b] = gradientColors[i]
    ansiText += `\x1B[38;2;${r};${g};${b}m${text[i]}\x1B[39m`
  }

  return ansiText
}

// const text = "LeaferJS - The High performance Canvas 2D graphics rendering engine.";
// const text = 'LeaferJS - 绚丽多彩的 HTML5 Canvas 2D 图形渲染引擎.'
// const text = '像小树发芽一样不断成长，充满希望和生命力.'
const text = 'Like a small tree sprouting, continuously growing, full of hope and vitality.'


// const startColor = 'rgb(50, 205, 121)' // 起始颜色
// const endColor = 'rgb(250, 243, 57)' // 结束颜色

const startColor = 'rgb(255, 0, 238)' // 起始颜色
const endColor = 'rgb(255, 170, 0)' // 结束颜色

const ansiGradientText = generateAnsiGradientText(text, startColor, endColor)
fs.writeFileSync('gradient_text.txt', JSON.stringify(ansiGradientText), 'utf8');
console.log(ansiGradientText)
