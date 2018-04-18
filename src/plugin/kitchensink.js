/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Public: A initialization function that sets up the Annotator and some of the
// default plugins. Intended for use with the annotator-full package.
//
// NOTE: This method is intened to be called via the jQuery .annotator() method
// although it is available directly on the Annotator instance.
//
// config  - An object containing config options for the AnnotateIt store.
//             storeUrl: API endpoint for the store (default: "http://annotateit.org/api")
//             tokenUrl: API endpoint for auth token provider (default: "http://annotateit.org/api/token")
//
// options - An object containing plugin settings to override the defaults.
//           If a plugin is entered with a 'falsy' value, the plugin will not be loaded.
//
// Examples
//
//   $('#content').annotator().annotator('setupPlugins');
//
//   // Only display a filter for the user field and disable tags.
//   $('#content').annotator().annotator('setupPlugins', null, {
//     Tags: false,
//     Filter: {
//       filters: [{label: 'User', property: 'user'}],
//       addAnnotationFilter: false
//     }
//   });
//
// Returns itself for chaining.
Annotator.prototype.setupPlugins = function(config, options) {
  if (config == null) { config = {}; }
  if (options == null) { options = {}; }
  const win = Annotator.Util.getGlobal();

  // Set up the default plugins.
  const plugins = ['Unsupported', 'Auth', 'Tags', 'Filter', 'Store', 'AnnotateItPermissions'];

  // If Showdown is included add the Markdown plugin.
  if (win.Showdown) {
    plugins.push('Markdown');
  }

  // Check the config for store credentials and add relevant plugins.
  const uri = win.location.href.split(/#|\?/).shift() || '';

  const pluginConfig = {
    Tags: {},
    Filter: {
      filters: [
        {label: Annotator._t('User'), property: 'user'},
        {label: Annotator._t('Tags'), property: 'tags'}
      ]
    },
    Auth: {
      tokenUrl: config.tokenUrl || 'http://annotateit.org/api/token'
    },
    Store: {
      prefix: config.storeUrl || 'http://annotateit.org/api',
      annotationData: {
        uri
      },
      loadFromSearch: {
        uri
      }
    }
  };

  for (var name of Object.keys(options || {})) {
    const opts = options[name];
    if (!Array.from(plugins).includes(name)) {
      plugins.push(name);
    }
  }

  $.extend(true, pluginConfig, options);

  return (() => {
    const result = [];
    for (name of Array.from(plugins)) {
      if (!(name in pluginConfig) || pluginConfig[name]) {
        result.push(this.addPlugin(name, pluginConfig[name]));
      } else {
        result.push(undefined);
      }
    }
    return result;
  })();
};
