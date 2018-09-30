const CURRENT_CACHES = {
  font: "font-cache-v1"
};

async function handleRequest(request) {
  const cache = await caches.open(CURRENT_CACHES.font);
  const cacheResponse = await cache.match(request);

  if (cacheResponse) {
    return cacheResponse;
  }

  const response = await fetch(request);

  if (
    response.status < 400 &&
    response.headers.has("content-type") &&
    response.headers.get("content-type").match(/(^application\/font|^font\/)/i)
  ) {
    cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", event => {
  if (
    event.request.cache === "only-if-cached" &&
    event.request.mode !== "same-origin"
  ) {
    event.respondWith(fetch(event.request));

    return;
  }

  event.respondWith(handleRequest(event.request));
});
