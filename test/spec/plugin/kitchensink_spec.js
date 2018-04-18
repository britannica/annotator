/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class MockPlugin {
  constructor() {}
  pluginInit() {}
}

describe('Annotator::setupPlugins', function() {
  let annotator = null;
  let $fix = null;

  beforeEach(function() {
    for (let p of ['AnnotateItPermissions', 'Auth', 'Markdown', 'Store', 'Tags', 'Unsupported']) {
      Annotator.Plugin[p] = MockPlugin;
    }

    addFixture('kitchensink');
    return $fix = $(fix());
  });

  afterEach(() => clearFixtures());

  it('should added to the Annotator prototype', () => assert.equal(typeof Annotator.prototype.setupPlugins, 'function'));

  it('should be callable via jQuery.fn.Annotator', function() {
    sinon.spy(Annotator.prototype, 'setupPlugins');

    $fix.annotator().annotator('setupPlugins', {}, {Filter: {appendTo: fix()}});
    return assert(Annotator.prototype.setupPlugins.calledOnce);
  });

  describe('called with no parameters', function() {
    let _Showdown = null;

    beforeEach(function() {
      _Showdown = window.Showdown;
      annotator = new Annotator(fix());
      return annotator.setupPlugins({}, {Filter: {appendTo: fix()}});
    });

    afterEach(() => window.Showdown = _Showdown);

    describe('it includes the Unsupported plugin', () =>
      it('should add the Unsupported plugin by default', () => assert.isDefined(annotator.plugins.Unsupported))
    );

    describe('it includes the Tags plugin', () =>
      it('should add the Tags plugin by default', () => assert.isDefined(annotator.plugins.Tags))
    );

    describe('it includes the Filter plugin', function() {
      let filterPlugin = null;

      beforeEach(() => filterPlugin = annotator.plugins.Filter);

      it('should add the Filter plugin by default', () => assert.isDefined(filterPlugin));

      return it('should have filters for annotations, tags and users', function() {
        let needle;
        const expectedFilters = ['text', 'user', 'tags'];
        return Array.from(expectedFilters).map((filter) =>
          assert.isTrue((needle = filter, Array.from((Array.from(filterPlugin.filters).map((f) => f.property))).includes(needle))));
      });
    });

    return describe('and with Showdown loaded in the page', () =>
      it('should add the Markdown plugin', () => assert.isDefined(annotator.plugins.Markdown))
    );
  });

  describe('called with AnnotateIt config', function() {
    beforeEach(function() {
      // Prevent store making initial AJAX requests.
      sinon.stub(Annotator.Plugin.Store.prototype, 'pluginInit');

      annotator = new Annotator(fix());
      return annotator.setupPlugins();
    });

    afterEach(() => Annotator.Plugin.Store.prototype.pluginInit.restore());

    it('should add the Store plugin', () => assert.isDefined(annotator.plugins.Store));

    it('should add the AnnotateItPermissions plugin', () => assert.isDefined(annotator.plugins.AnnotateItPermissions));

    return it('should add the Auth plugin', () => assert.isDefined(annotator.plugins.Auth));
  });

  return describe('called with plugin options', function() {
    beforeEach(() => annotator = new Annotator(fix()));

    it('should override default plugin options', function() {
      annotator.setupPlugins(null, {
        AnnotateItPermissions: false,
        Filter: {
          filters: null,
          addAnnotationFilter: false,
          appendTo: fix()
        }
      }
      );

      return assert.lengthOf(annotator.plugins.Filter.filters, 0);
    });

    return it('should NOT load a plugin if its key is set to null OR false', function() {
      annotator.setupPlugins(null, {Filter: false, Tags: null});
      assert.isUndefined(annotator.plugins.Tags);
      return assert.isUndefined(annotator.plugins.Filter);
    });
  });
});
