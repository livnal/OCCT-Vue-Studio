<!--
 * Drawing2D.vue
 * 负责渲染当前模型的 2D 截面视图。
 * 使用 SVG 显示外管、内孔、法兰边界和高度参考线。
 -->
<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'Drawing2D',
  props: { params: { type: Object, required: false } },
  setup(props) {
    // 计算当前参数的 2D 可视化数据。
    const view = computed(() => {
      const p = props.params;
      if (!p) return null;
      const outerR = p.diameter / 2;
      const innerR = outerR - p.thickness;
      const flangeR = p.flange;
      const outerD = p.diameter;
      const innerD = Math.max(0, p.diameter - p.thickness * 2);
      const flangeD = flangeR * 2;
      const maxRadius = Math.max(flangeR, outerR);
      const scale = Math.min(120 / maxRadius, 160 / p.height, 1);
      return {
        outerR,
        innerR,
        flangeR,
        outerD,
        innerD,
        flangeD,
        height: p.height,
        scaledOuterR: outerR * scale,
        scaledInnerR: innerR * scale,
        scaledFlangeR: flangeR * scale,
        scaledHeight: p.height * scale,
        scale
      };
    });

    return { view };
  }
});
</script>

<template>
  <div style="margin-top: 12px">
    <h4>2D 工程图（截面）</h4>
    <div v-if="!view">请先生成模型</div>
    <svg
      v-else
      :width="320"
      :height="220"
      style="border: 1px solid #ddd; background: #fff"
    >
      <g transform="translate(160,110)">
        <!-- 法兰外边界，使用虚线表示。 -->
        <circle
          :r="view.scaledFlangeR"
          stroke="#333"
          stroke-width="1"
          fill="none"
          stroke-dasharray="4 2"
        />
        <!-- 外管壁轮廓。 -->
        <circle :r="view.scaledOuterR" stroke="#111" stroke-width="2" fill="none" />
        <!-- 内孔轮廓。 -->
        <circle :r="view.scaledInnerR" stroke="#111" stroke-width="1" fill="none" />

        <!-- 竖向高度标注线。 -->
        <line
          :x1="-view.scaledOuterR - 24"
          :y1="-view.scaledHeight / 2"
          :x2="-view.scaledOuterR - 24"
          :y2="view.scaledHeight / 2"
          stroke="#444"
          stroke-width="1"
          stroke-dasharray="4 2"
        />
        <line
          :x1="-view.scaledOuterR - 28"
          :y1="-view.scaledHeight / 2"
          :x2="-view.scaledOuterR - 20"
          :y2="-view.scaledHeight / 2"
          stroke="#444"
          stroke-width="1"
        />
        <line
          :x1="-view.scaledOuterR - 28"
          :y1="view.scaledHeight / 2"
          :x2="-view.scaledOuterR - 20"
          :y2="view.scaledHeight / 2"
          stroke="#444"
          stroke-width="1"
        />
        <text
          :x="-view.scaledOuterR - 36"
          :y="0"
          fill="#222"
          font-size="12"
          text-anchor="end"
          dominant-baseline="middle"
        >
          高度 {{ view.height }} mm
        </text>

        <!-- 水平外径标注线。 -->
        <line
          :x1="-view.scaledOuterR"
          :y1="view.scaledHeight / 2 + 24"
          :x2="view.scaledOuterR"
          :y2="view.scaledHeight / 2 + 24"
          stroke="#444"
          stroke-width="1"
        />
        <line
          :x1="-view.scaledOuterR"
          :y1="view.scaledHeight / 2 + 20"
          :x2="-view.scaledOuterR"
          :y2="view.scaledHeight / 2 + 28"
          stroke="#444"
          stroke-width="1"
        />
        <line
          :x1="view.scaledOuterR"
          :y1="view.scaledHeight / 2 + 20"
          :x2="view.scaledOuterR"
          :y2="view.scaledHeight / 2 + 28"
          stroke="#444"
          stroke-width="1"
        />
        <text
          x="0"
          :y="view.scaledHeight / 2 + 42"
          fill="#222"
          font-size="12"
          text-anchor="middle"
        >
          外径 {{ view.outerD }} mm
        </text>

        <!-- 内径与法兰尺寸提示 -->
        <text x="0" y="-10" fill="#555" font-size="12" text-anchor="middle">
          内径 {{ view.innerD }} mm
        </text>
        <text x="0" y="16" fill="#555" font-size="12" text-anchor="middle">
          法兰直径 {{ view.flangeD }} mm
        </text>
      </g>
    </svg>
  </div>
</template>
