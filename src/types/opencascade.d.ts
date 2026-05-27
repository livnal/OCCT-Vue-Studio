/*
 * @Descripttion:
 * @version:
 * @FilePath: /project-demo/src/types/opencascade.d.ts
 */
// OpenCascade WASM 包的自定义 TypeScript 声明。
// 用于告诉 TypeScript 如何识别导入的 JS/WASM 模块，而无需完整定义库类型。
declare module 'opencascade.js/dist/opencascade.wasm.js' {
  const OpenCascade: any;
  export default OpenCascade;
}

declare module 'opencascade.js/dist/opencascade.wasm.wasm?url' {
  const url: string;
  export default url;
}
