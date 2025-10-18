const mix = require('laravel-mix');

// Reduce noise in watch mode and avoid Windows notification popups
mix.disableNotifications();

mix.webpackConfig({
   stats: 'minimal',
   resolve: {
      // Ensure extensions include leading dot to avoid warnings
      extensions: ['.wasm', '.mjs', '.js', '.jsx', '.json']
   }
});

mix.js('resources/js/index.js', 'public/js')
    .react()
    .sass('resources/sass/app.scss', 'public/css')
    .sourceMaps();
