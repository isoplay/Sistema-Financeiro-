const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    plugins: {
      add: [
        new InjectManifest({
          swSrc: './src/service-worker.js',
          swDest: 'service-worker.js',
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        }),
      ],
    },
  },
};