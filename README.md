<!--
 * @Descripttion:
 * @version:
 * @FilePath: /OCCT-Vue-Studio/README.md
-->

# OCCT Vue Studio

一个基于 Web 的参数化建模演示项目。用户可以通过输入几何参数，实时生成带有法兰结构的圆柱管 **2D 工程截面图** 和 **3D 交互式模型**。

## 🔗 在线访问

- ngrok公网访问：https://macaroni-snuff-clergyman.ngrok-free.dev/


## 🚀 主要特性

- **参数化设计**：支持自定义直径、高度、壁厚及法兰半径。
- **2D 工程视图**：基于 SVG 的动态截面展示，包含自动标注的尺寸线。
- **3D 实时渲染**：利用 Three.js 实现 WebGL 渲染，支持鼠标旋转、缩放和平移。
- **WASM 几何内核**：集成 OpenCascade.js (OCCT)，在浏览器端执行专业的布尔运算（切割、融合）和网格生成。

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
| :--- | :--- | :--- |
| **框架** | Vue 3 + TypeScript | 响应式 UI 与类型安全 |
| **构建工具** | Vite | 极速的开发服务器与构建流程 |
| **3D 引擎** | Three.js | 场景管理、光照与材质渲染 |
| **几何内核** | OpenCascade.js | 工业级 CAD 几何建模 (WASM) |

## 📦 快速运行

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   # 访问 http://localhost:5173
   ```

3. **生产环境构建**
   ```bash
   npm run build
   # 产物位于 dist/ 目录
   ```

## 💡 开发指南

### 核心逻辑说明
- **几何生成**：位于 [`src/services/occt.ts`]。通过 OCCT 的 `BRepPrimAPI` 创建基础圆柱，利用 `BRepAlgoAPI_Cut` 挖空内孔，再通过 `BRepAlgoAPI_Fuse` 融合底部法兰。
- **3D 渲染**：位于 [`src/components/Viewer3D.vue`]。负责将 OCCT 生成的三角网格转换为 Three.js 的 `BufferGeometry`，并添加尺寸标注 Sprite。
- **2D 绘图**：位于 [`src/components/Drawing2D.vue`]。纯 SVG 实现，根据参数动态计算比例尺和标注位置。

### 注意事项
- **WASM 加载**：首次加载 `opencascade.wasm` 可能需要几秒钟，请确保网络通畅，在线访问时首次加载时间长达十分钟左右。
- **类型定义**：由于 OCCT 是通过 Emscripten 导出的 JS 接口，目前项目中使用了部分 `any` 类型。如需更严格的类型检查，可参考 `src/types/opencascade.d.ts` 进行扩展。

