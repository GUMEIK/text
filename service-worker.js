const CACHE_NAME = 'md-encrypt-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/html/style.css',
  '/html/script.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// 安装service worker并缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 激活service worker并清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 处理fetch请求，实现离线访问
self.addEventListener('fetch', (event) => {
  // 只处理 http/https 请求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到响应，则返回缓存的响应
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查是否收到有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            try {
              // 克隆响应，因为响应流只能使用一次
              const responseToCache = response.clone();

              // 将新响应添加到缓存
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // 只缓存同源请求
                  if (new URL(event.request.url).origin === location.origin) {
                    cache.put(event.request, responseToCache);
                  }
                });
            } catch (error) {
              console.error('Caching failed:', error);
            }

            return response;
          });
      })
  );
});