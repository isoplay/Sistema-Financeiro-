/* eslint-disable no-restricted-globals */
// Service Worker minimalista - Network Only
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});