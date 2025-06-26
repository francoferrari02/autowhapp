const { override, addPostcssPlugins } = require('customize-cra');
const path = require('path');

module.exports = override(
  addPostcssPlugins([
    require('tailwindcss'),
    require('autoprefixer'),
  ]),
  (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      },
    };
    // Ensure the module resolution includes .ts and .tsx
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    return config;
  }
);