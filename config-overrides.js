const { override, addPostcssPlugins } = require('react-app-rewired');

module.exports = override(
  addPostcssPlugins([
    require('tailwindcss'),
    require('autoprefixer'),
  ])
);