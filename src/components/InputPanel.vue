<script lang="ts">
import { defineComponent, reactive, toRefs, watch } from 'vue';

export default defineComponent({
  name: 'InputPanel',
  props: { initial: { type: Object, required: true } },
  emits: ['generate'],
  setup(props, { emit }) {
    // 本地响应式状态，用于双向绑定输入框值。
    const state = reactive({
      diameter: props.initial.diameter ?? 60,
      height: props.initial.height ?? 40,
      thickness: props.initial.thickness ?? 4,
      flange: props.initial.flange ?? 100
    });

    // 如果父组件传入的初始参数变化，保持输入状态同步更新。
    watch(
      () => props.initial,
      (v) => {
        state.diameter = v.diameter;
        state.height = v.height;
        state.thickness = v.thickness;
        state.flange = v.flange;
      }
    );

    // 用户点击生成模型时，将参数规范化为数字并发出事件。
    function generate() {
      emit('generate', {
        diameter: Number(state.diameter),
        height: Number(state.height),
        thickness: Number(state.thickness),
        flange: Number(state.flange)
      });
    }

    return { ...toRefs(state), generate };
  }
});
</script>

<template>
  <div>
    <h3>参数输入</h3>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px">
      <label>直径 (mm): <input type="number" v-model="diameter" /></label>
      <label>高度 (mm): <input type="number" v-model="height" /></label>
      <label>壁厚 (mm): <input type="number" v-model="thickness" /></label>
      <label>法兰半径 (mm): <input type="number" v-model="flange" /></label>
      <button @click="generate">生成模型</button>
    </div>
  </div>
</template>
