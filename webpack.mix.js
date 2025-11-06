const mix = require('laravel-mix');

// Reduce noise in watch mode and avoid Windows notification popups
mix.disableNotifications();

mix.webpackConfig({
   stats: 'minimal',
   resolve: {
      // Ensure extensions include leading dot to avoid warnings
      extensions: ['.wasm', '.mjs', '.js', '.jsx', '.json'],
      // Fix ESM fully specified resolution issues and React 17 jsx-runtime path
      alias: {
         'react/jsx-runtime': 'react/jsx-runtime.js'
      },
      // In Webpack 5, ensure extensionless ESM specifiers are allowed
      fullySpecified: false
   }
});

mix.js('resources/js/index.js', 'public/js')
    .react()
    .sass('resources/sass/app.scss', 'public/css')
    .sourceMaps();
