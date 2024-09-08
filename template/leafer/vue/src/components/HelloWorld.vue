<script setup lang="ts">
import { onMounted } from 'vue'
import { App, Rect, Text, Group, PointerEvent } from 'leafer-ui'
import 'leafer-editor'
import '@leafer-in/state'
import { Flow } from '@leafer-in/flow'
onMounted(() => {
  const leafer = new App({ view: 'leafer-view', fill: '#242424', editor: {} })
  let { width = 1080, height = 960 } = leafer

  const vue = new Rect({
    width: 100,
    height: 100,
    fill: {
      type: 'image',
      url: '/vue.svg',
      mode: 'fit'
    },
    editable: true,
    hoverStyle: {
      shadow: {
        x: 0,
        y: 0,
        blur: 20,
        color: '#42b883aa'
      }
    }
  })
  const vite = new Rect({
    x: 150,
    width: 100,
    height: 100,
    fill: {
      type: 'image',
      url: '/vite.svg',
      mode: 'fit'
    },
    hoverStyle: {
      shadow: {
        x: 0,
        y: 0,
        blur: 20,
        color: '#646cffaa'
      }
    },
    editable: true
  })
  const leaferJS = new Rect({
    x: 300,
    width: 100,
    height: 100,
    fill: {
      type: 'image',
      url: '/leafer.svg',
      mode: 'fit'
    },
    hoverStyle: {
      shadow: {
        x: 0,
        y: 0,
        blur: 20,
        color: '#32cd79'
      }
    },
    editable: true
  })
  leaferJS.on(PointerEvent.DOUBLE_TAP, () => {
    window.open('https://www.leaferjs.com/ui/guide/')
  })
  const text = new Text({
    fill: 'rgba(255, 255, 255, 0.87)',
    fontSize: 35,
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontWeight: 'bold',
    text: 'Vue + Vite + LeaferJS'
  })
  const docs = createText('Double-click on the LeaferJS logo to learn more.')
  const moveHint = createText(
    'Move View : scroll wheel or hold mouse wheel while dragging'
  )
  const zoomHint = createText('Zoom View : alt + mouse wheel')
  let logoGroup = new Group({
    x: width / 2 - 200,
    y: height * 0.4,
    children: [vue, vite, leaferJS]
  })
  let textGroup = new Flow({
    x: width / 2 - 220,
    y: height * 0.4 + 150,
    flow: 'y',
    flowAlign: 'center',
    children: [text, docs]
  })
  let hintGroup = new Flow({
    flow: 'y',
    flowAlign: 'left',
    children: [moveHint, zoomHint]
  })
  leafer.tree.add(logoGroup)
  leafer.tree.add(textGroup)
  leafer.sky.add(hintGroup)
})
const createText = (text: string): Text => {
  return new Text({
    fill: '#888',
    fontSize: 20,
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    text
  })
}
</script>

<template>
  <div id="leafer-view"></div>
</template>

<style scoped>
#leafer-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
