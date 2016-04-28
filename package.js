'use strict';
/*global Package*/

Package.describe({
  summary: 'Reactive Cache',
  version: '0.0.1',
  name:'anthonyastige:reactive-cache',
  git:'git@github.com:AnthonyAstige/reactive-cache.git'
});

Package.onUse(function(api) {
	api.versionsFrom('1.0.3.1');
	api.use('underscore');

	api.use([ 'reactive-var' ]);

	api.addFiles([ 'export.js', 'cache.js' ]);

	api.export('ReactiveCache');
});
