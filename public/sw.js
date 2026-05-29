/**
 * Service Worker - 缓存策略
 * 用于缓存 OpenCascade WASM 文件和其他静态资源，提升二次访问速度
 */

const CACHE_NAME = 'occt-vue-studio-v1';

// 動態獲取 base 路徑，兼容 GitHub Pages 子路徑部署
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  // WASM 文件会在运行时动态添加到缓存
];

/**
 * 安装事件：预缓存核心资源
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: 缓存核心资源');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

/**
 * 激活事件：清理旧缓存
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Service Worker: 删除旧缓存', name);
            return caches.delete(name);
          })
      );
    })
  );
});

/**
 * 安全地将 Response 缓存到 Cache Storage
 * 跳过 opaque response 和不可克隆的 response，避免报错
 */
async function safeCachePut(request, response, cacheName) {
  try {
    // opaque response（跨域无 CORS）不可读取，跳过缓存
    if (response.type === 'opaque') return;
    // response body 已被使用则无法克隆，跳过缓存
    if (response.bodyUsed) return;
    const responseToCache = response.clone();
    const cache = await caches.open(cacheName);
    await cache.put(request, responseToCache);
  } catch (e) {
    // 缓存失败不影响正常响应，静默忽略
    console.warn('Service Worker: 缓存失败', request.url, e.message);
  }
}

/**
 * 请求拦截：采用缓存优先策略，网络回退
 * 特别优化 WASM 文件的缓存行为
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isWasm = url.pathname.endsWith('.wasm');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        if (isWasm) {
          console.log('Service Worker: 从缓存加载 WASM', url.pathname);
          // 后台更新缓存（WASM 使用 stale-while-revalidate 策略）
          fetch(event.request).then((networkResponse) => {
            safeCachePut(event.request, networkResponse, CACHE_NAME);
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // 缓存未命中，从网络获取
      return fetch(event.request).then((networkResponse) => {
        // 只缓存成功的 GET 请求
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          if (isWasm) {
            console.log('Service Worker: 从网络加载 WASM 并缓存', url.pathname);
          }
          safeCachePut(event.request, networkResponse, CACHE_NAME);
        }
        return networkResponse;
      });
    }).catch(() => {
      // 网络失败时返回离线页面
      if (event.request.destination === 'document') {
        return caches.match(`${BASE_PATH}/index.html`);
      }
    })
  );
});
