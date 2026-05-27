<script lang="ts">
import { defineComponent, ref } from 'vue'
import InputPanel from './components/InputPanel.vue'
import Drawing2D from './components/Drawing2D.vue'
import Viewer3D from './components/Viewer3D.vue'

export default defineComponent({
  name: 'App',
  components: { InputPanel, Drawing2D, Viewer3D },
  setup() {
// 默认模型参数，用于初始显示。
  const params = ref({ diameter: 60, height: 40, thickness: 4, flange: 100 })

  // 当前传递给 2D/3D 视图的模型参数。
  const shapeData = ref(null as any)

  // 当用户点击生成模型时触发。
  // 更新 2D 图形和 3D 视图的参数数据。
    function onGenerate(p: any) {
      params.value = p
      shapeData.value = p
    }

    return { params, onGenerate, shapeData }
  }
})
</script>

<template>
  <div class="app">
    <div class="left">
      <!-- 左侧区域：参数输入和 2D 预览面板。 -->
      <InputPanel :initial="params" @generate="onGenerate" />
      <Drawing2D :params="shapeData" />
    </div>
    <div class="right">
      <!-- 右侧区域：显示生成的 3D 模型。 -->
      <Viewer3D :params="shapeData" />
    </div>
  </div>
</template>
