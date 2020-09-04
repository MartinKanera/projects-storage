// THIS FILE SHOULD NOT BE VERSION CONTROLLED

const ignorePaths = <%= serialize(options.ignorePaths) %>

importScripts(
  'https://www.gstatic.com/firebasejs/<%= options.firebaseVersion %>/firebase-app.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/<%= options.firebaseVersion %>/firebase-auth.js'
)
firebase.initializeApp(<%= serialize(options.config) %>)

const getIdToken = () => {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        // force token refresh as it might be used to sign in server side
        user.getIdToken(true).then(
          (idToken) => {
            resolve(idToken);
          },
          () => {
            resolve(null);
          },
        );
      } else {
        resolve(null);
      }
    });
  });
};

const fetchWithAuthorization = async (original, idToken) => {
  // Clone headers as request headers are immutable.
  const headers = new Headers();
  for (let entry of original.headers.entries()) {
    headers.append(entry[0], entry[1]);
  }

  // Add ID token to header.
  headers.append('Authorization', 'Bearer ' + idToken);

  // Create authorized request
  const { url, ...props } = original.clone();
  const authorized = new Request(url, {
    ...props,
    mode: 'same-origin',
    redirect: 'manual',
    headers,
  });

  return fetch(authorized);
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const expectsHTML = event.request.headers.get('accept').includes('text/html');
  const isSameOrigin = self.location.origin === url.origin;
  const isHttps = self.location.protocol === 'https:' || self.location.hostname === 'localhost';
  const isIgnored = ignorePaths.some((path) => {
    if (typeof path === 'string') {
      return url.pathname.startsWith(path);
    }

    return path.test(url.pathname.slice(1));
  });

  if (!expectsHTML || !isSameOrigin || !isHttps || isIgnored) {
    event.respondWith(fetch(event.request));

    return;
  }

  // Fetch the resource after checking for the ID token.
  // This can also be integrated with existing logic to serve cached files
  // in offline mode.
  event.respondWith(
    getIdToken().then((idToken) =>
      idToken
        ? // if the token was retrieved we attempt an authorized fetch
          // if anything goes wrong we fall back to the original request
          fetchWithAuthorization(event.request, idToken).catch(() => fetch(event.request))
        : // otherwise we return a fetch of the original request directly
          fetch(event.request),
    ),
  );
});

// In service worker script.
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

console.log('test');
