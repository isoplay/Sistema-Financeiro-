/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'financeiro-app-v1';
self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  // Network-only strategy (sem cache complexo para evitar erros de build)
});
