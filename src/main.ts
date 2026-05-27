/*
 * 应用入口文件。
 * 负责启动 Vue 3 应用，并挂载到页面中的 id="app" 元素上。
 */
import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

// 创建并挂载主 Vue 应用实例。
createApp(App).mount('#app');
