// sw.js must be in the root (not under js/) because the max scope for a
// service worker is the location of the worker itself.
// Most of the code in this file is copied or heavily derived from
// https://developers.google.com/web/fundamentals/primers/service-workers/

var CACHE_VERSION = 1; // update this value when updating the app
var CACHE_NAME = 'wormy-cache-v' + CACHE_VERSION;
var localURLsToCache = [
  '.',
  'index.html',
  'favicon.ico',
  'manifest.json',
  'icon_16.png',
  'icon_128.png',
  'icon_144.png',
  'icon_192.png',
  'icon_512.png',
  'css/wormy.css',
  'gfx/wormy.png',
  'js/main.js',
  'js/wormy-client.js',
  'js/wormy-common.js',
  'js/wormy-levels.js',
  'js/wormy-server.js'
];
var externalURLsToCache = [
  'https://flackr.github.io/lobby/client/lobby.js'
]

// install event: is run on first pageload or whenever sw.js is modified. Note
// that 'installed' service workers are not 'activated' until all current pages
// using the previous version of the service worker are killed.
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache "' + CACHE_NAME + '"');
        return cache.addAll(localURLsToCache.concat(externalURLsToCache));
      })
  );
});

// fetch event: when the service worker is active, this event intercepts all
// network fetch attempts. We first check if the URL requested is already in
// our cache, and if it is, we return it directly. If not, then we proceed to
// actually do a network fetch, then we cache the result of the fetch for next
// time.
self.addEventListener('fetch', function(event) {
  event.respondWith(
   if (externalURLsToCache.includes(event.request.url)) {
      // Try to fetch the external response first.
      fetch(event.request).then(function(response) {
        // Check if we received a valid response
        if (response && response.status == 200) {
	  // IMPORTANT: Clone the response. A response is a stream
	  // and because we want the browser to consume the respons
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
	    console.log('Opened cache for "' + event.request.url + '"')
            cache.put(event.request, responseToCache);
          });
          return response;
        }  

	// Use cache if fetch does not succeed. 
	return caches.match(event.request).then(function(cachedResponse) {
          // Cache hits.
	  if (cachedResponse) {
            console.log('Returning cached result for "' + event.request.url + '"')
            return `      }
          return response;
	});

      });
    }
    else {	
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          console.log('Returning cached result for "' + event.request.url + '"')
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                console.log('Opened cache for "' + event.request.url + '"')
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
}
    );
});

// activate event: this is called when the service worker is installed AND the
// previous service worker (if any) stops being used. We use this event to
// clear out previous versions of cache.
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log('Cleared out all previous cache except ["' + cacheWhitelist.join('", "') + '"]')
});
