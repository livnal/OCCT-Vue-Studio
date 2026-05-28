<!--
 * @Descripttion:
 * @version:
 * @FilePath: /OCCT-Vue-Studio/README.md
-->

# OCCT Vue Studio

一个基于 Web 的参数化建模演示项目。用户可以通过输入几何参数，实时生成带有法兰结构的圆柱管 **2D 工程截面图** 和 **3D 交互式模型**。

## 🔗 在线访问

- **GitHub Pages**: [https://livnal.github.io/OCCT-Vue-Studio/](https://livnal.github.io/OCCT-Vue-Studio/)

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

4. **部署到 GitHub Pages**
   ```bash
   # 方式一：使用自动化工作流（推荐）
   # 推送到 main/master 分支后自动触发部署
   
   # 方式二：手动部署
   npm run deploy
   git add dist/.nojekyll
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

## 🌐 GitHub Pages 部署说明

本项目已配置自动化部署流程：

### 自动部署
1. 确保你的代码已推送到 GitHub 仓库的 `main` 或 `master` 分支
2. 在仓库设置中启用 GitHub Pages：
   - 进入 **Settings** → **Pages**
   - 在 **Source** 下选择 **GitHub Actions**
3. 每次推送到主分支时会自动触发部署

### 手动部署
```bash
npm run deploy
```

### 注意事项
- 首次部署可能需要 1-2 分钟
- 部署成功后，访问地址为：`https://your-username.github.io/OCCT-Vue-Studio/`
- 如果遇到 404 错误，请检查仓库名称是否与 `vite.config.ts` 中的 base 路径一致

## 💡 开发指南

### 核心逻辑说明
- **几何生成**：位于 [`src/services/occt.ts`]。通过 OCCT 的 `BRepPrimAPI` 创建基础圆柱，利用 `BRepAlgoAPI_Cut` 挖空内孔，再通过 `BRepAlgoAPI_Fuse` 融合底部法兰。
- **3D 渲染**：位于 [`src/components/Viewer3D.vue`]。负责将 OCCT 生成的三角网格转换为 Three.js 的 `BufferGeometry`，并添加尺寸标注 Sprite。
- **2D 绘图**：位于 [`src/components/Drawing2D.vue`]。纯 SVG 实现，根据参数动态计算比例尺和标注位置。

### 注意事项
- **WASM 加载**：首次加载 `opencascade.wasm` 可能需要几秒钟，请确保网络通畅。
- **类型定义**：由于 OCCT 是通过 Emscripten 导出的 JS 接口，目前项目中使用了部分 `any` 类型。如需更严格的类型检查，可参考 `src/types/opencascade.d.ts` 进行扩展。
