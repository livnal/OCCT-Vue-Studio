/*
 * 应用入口文件。
 * 负责启动 Vue 3 应用，并挂载到页面中的 id="app" 元素上。
 */
import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

/**
 * 注册 Service Worker，用于缓存 WASM 文件和其他静态资源。
 * 提升二次访问速度，支持离线使用。
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log('Service Worker 注册成功:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker 注册失败:', error);
      });
  });
}

// 创建并挂载主 Vue 应用实例。
createApp(App).mount('#app');
