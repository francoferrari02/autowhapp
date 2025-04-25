module.exports = function override(config) {
    // Buscar la regla que contiene el cargador de PostCSS
    const rules = config.module.rules.find((rule) => Array.isArray(rule.oneOf))?.oneOf;
  
    if (!rules) {
      console.error('No se encontró la configuración de "oneOf" en las reglas de Webpack.');
      return config;
    }
  
    const postcssLoader = rules.find(
      (rule) =>
        rule.use &&
        rule.use.some(
          (u) => u.loader && u.loader.includes('postcss-loader')
        )
    );
  
    if (postcssLoader) {
      postcssLoader.use = postcssLoader.use.map((u) => {
        if (u.loader && u.loader.includes('postcss-loader')) {
          u.options.postcssOptions = {
            plugins: [
              require('tailwindcss'),
              require('autoprefixer'),
            ],
          };
        }
        return u;
      });
    } else {
      console.error('No se encontró el cargador de PostCSS en las reglas de Webpack.');
    }
  
    return config;
  };