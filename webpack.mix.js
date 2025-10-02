const mix = require('laravel-mix');

mix.js('resources/js/index.js', 'public/js')
   .react()
   .sass('resources/sass/app.scss', 'public/css')
   .sourceMaps();
