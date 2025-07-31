const CACHE_NAME = 'md-encrypt-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './html/style.css',
  './html/script.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
].map(path => {
  // 检测是否在GitHub Pages环境
  if (self.location.hostname.includes('github.io')) {
    // 如果是GitHub Pages环境，添加/text前缀
    return `/text${path.startsWith('./') ? path.slice(1) : path}`;
  }
  return path;
});

// 预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching app shell and content');
        return cache.addAll(ASSETS_TO_CACHE).catch(error => {
          console.error('Pre-caching failed:', error);
          throw error;
        });
      }),
      // 确保新的service worker立即激活
      self.skipWaiting()
    ]).catch(error => {
      console.error('Install failed:', error);
      throw error;
    })
  );
});

// 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 确保新的service worker控制所有客户端
      self.clients.claim()
    ]).catch(error => {
      console.error('Activation failed:', error);
      throw error;
    })
  );
});

// 实现离线优先的缓存策略
self.addEventListener('fetch', (event) => {
  // 只处理GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 解析请求URL
  const requestURL = new URL(event.request.url);

  // 只处理同源请求和特定的静态资源
  if (requestURL.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // 如果有缓存响应，直接返回
          if (cachedResponse) {
            return cachedResponse;
          }

          // 否则尝试从网络获取
          return fetch(event.request)
            .then((networkResponse) => {
              // 检查响应是否有效
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }

              // 克隆响应用于缓存
              const responseToCache = networkResponse.clone();

              // 异步更新缓存
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                    .catch(error => {
                      console.error('Cache put failed:', error);
                    });
                })
                .catch(error => {
                  console.error('Cache open failed:', error);
                });

              return networkResponse;
            })
            .catch((error) => {
              console.error('Network fetch failed:', error);
              
              // 如果是HTML请求，返回离线页面
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('./index.html');
              }
              
              throw error;
            });
        })
    );
  }
});