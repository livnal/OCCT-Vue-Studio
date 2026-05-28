/**
 * Service Worker - 缓存策略
 * 用于缓存 OpenCascade WASM 文件和其他静态资源，提升二次访问速度
 */

const CACHE_NAME = 'occt-vue-studio-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
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
 * 请求拦截：采用缓存优先策略，网络回退
 * 特别优化 WASM 文件的缓存行为
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 对 WASM 文件使用特殊的缓存策略
  if (url.pathname.endsWith('.wasm')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: 从缓存加载 WASM', url.pathname);
            // 后台更新缓存
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
            }).catch(() => {
              // 忽略网络错误
            });
            return cachedResponse;
          }
          
          // 缓存未命中，从网络获取并缓存
          return fetch(event.request).then((networkResponse) => {
            console.log('Service Worker: 从网络加载 WASM 并缓存', url.pathname);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // 其他资源使用标准的缓存优先策略
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // 只缓存成功的 GET 请求
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // 网络失败时返回离线页面
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
