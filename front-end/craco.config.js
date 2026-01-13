const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Configuração para copiar service-worker.js para a build
      const CopyPlugin = require('copy-webpack-plugin');
      
      webpackConfig.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'src/service-worker.js'),
              to: path.resolve(__dirname, 'build'),
            },
          ],
        })
      );
      
      return webpackConfig;
    },
  },
};