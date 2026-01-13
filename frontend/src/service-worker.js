/* eslint-disable no-restricted-globals */
// Service Worker simplificado para permitir instalação mas priorizar rede

const CACHE_NAME = 'financeiro-app-online-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler básico que não cacheia, apenas busca na rede
// Isso satisfaz o requisito de PWA sem criar complexidade de cache
self.addEventListener('fetch', (event) => {
  // Não faz nada, deixa o navegador buscar na rede normalmente
});