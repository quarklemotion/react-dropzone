const webpackConfig = require('./webpack.config.js');

module.exports = {
  title: 'react-dropzone',
  showCode: true,
  highlightTheme: 'elegant',
  sections: [
    {
      name: 'Installation',
      content: 'README.md'
    },
    {
      name: 'PropTypes',
      components: './src/index.js'
    }
  ],
  updateWebpackConfig() {
    delete webpackConfig.externals;
    return webpackConfig;
  }
};
