const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
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