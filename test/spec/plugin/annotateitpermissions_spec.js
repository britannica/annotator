/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Plugin.AnnotateItPermissions', function() {
  let el = null;
  let permissions = null;

  beforeEach(function() {
    el = $("<div class='annotator-viewer'></div>").appendTo('body')[0];
    return permissions = new Annotator.Plugin.AnnotateItPermissions(el);
  });

  afterEach(() => $(el).remove());

  it("it should set user for newly created annotations on beforeAnnotationCreated", function() {
    const ann = {};
    permissions.setUser({userId: 'alice', consumerKey: 'fookey'});
    $(el).trigger('beforeAnnotationCreated', [ann]);
    return assert.equal(ann.user, 'alice');
  });

  it("it should set consumer for newly created annotations on beforeAnnotationCreated", function() {
    const ann = {};
    permissions.setUser({userId: 'alice', consumerKey: 'fookey'});
    $(el).trigger('beforeAnnotationCreated', [ann]);
    return assert.equal(ann.consumer, 'fookey');
  });

  return describe('authorize', function() {
    let annotations = null;

    beforeEach(() =>
      annotations = [
        {},                                        // 0
        { user: 'alice' },                         // 1
        { user: 'alice', consumer: 'annotateit' }, // 2
        { permissions: {} },                       // 3
        {                                         // 4
          permissions: {
            'read': ['group:__world__']
          }
        },
        {                                         // 5
          permissions: {
          'update': ['group:__authenticated__']
          }
        },
        {                                         // 6
          consumer: 'annotateit',
          permissions: {
            'read': ['group:__consumer__']
          }
        }
      ]);

    it('should NOT allow any action for an annotation with no owner info and no permissions', function() {
      const a = annotations[0];
      assert.isFalse(permissions.authorize(null,  a));
      assert.isFalse(permissions.authorize('foo', a));
      permissions.setUser({userId: 'alice', consumerKey: 'annotateit'});
      assert.isFalse(permissions.authorize(null,  a));
      return assert.isFalse(permissions.authorize('foo', a));
    });

    it('should NOT allow any action if an annotation has only user set (but no consumer)', function() {
      const a = annotations[1];
      assert.isFalse(permissions.authorize(null,  a));
      assert.isFalse(permissions.authorize('foo', a));
      permissions.setUser({userId: 'alice', consumerKey: 'annotateit'});
      assert.isFalse(permissions.authorize(null,  a));
      return assert.isFalse(permissions.authorize('foo', a));
    });

    it('should allow any action if the current auth info identifies the owner of the annotation', function() {
      const a = annotations[2];
      permissions.setUser({userId: 'alice', consumerKey: 'annotateit'});
      assert.isTrue(permissions.authorize(null,  a));
      return assert.isTrue(permissions.authorize('foo', a));
    });

    it('should NOT allow any action for an annotation with no owner info and empty permissions field', function() {
      const a = annotations[3];
      assert.isFalse(permissions.authorize(null,  a));
      assert.isFalse(permissions.authorize('foo', a));
      permissions.setUser({userId: 'alice', consumerKey: 'annotateit'});
      assert.isFalse(permissions.authorize(null,  a));
      return assert.isFalse(permissions.authorize('foo', a));
    });

    it('should allow an action when the action field contains the world group', function() {
      const a = annotations[4];
      assert.isTrue(permissions.authorize('read', a));
      permissions.setUser({userId: 'alice', consumerKey: 'annotateit'});
      return assert.isTrue(permissions.authorize('read', a));
    });

    it('should allow an action when the action field contains the authenticated group and the plugin has auth info', function() {
      const a = annotations[5];
      assert.isFalse(permissions.authorize('update', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'anywhere'});
      return assert.isTrue(permissions.authorize('update', a));
    });

    it('should allow an action when the action field contains the consumer group and the plugin has auth info with a matching consumer', function() {
      const a = annotations[6];
      assert.isFalse(permissions.authorize('read', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'anywhere'});
      assert.isFalse(permissions.authorize('read', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'annotateit'});
      return assert.isTrue(permissions.authorize('read', a));
    });

    it('should allow an action when the action field contains the consumer group and the plugin has auth info with a matching consumer', function() {
      const a = annotations[6];
      assert.isFalse(permissions.authorize('read', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'anywhere'});
      assert.isFalse(permissions.authorize('read', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'annotateit'});
      return assert.isTrue(permissions.authorize('read', a));
    });

    return it('should allow an action when the user is an admin of the annotation\'s consumer', function() {
      const a = annotations[2];
      permissions.setUser({userId: 'anyone', consumerKey: 'anywhere', admin: true});
      assert.isFalse(permissions.authorize('read', a));
      permissions.setUser({userId: 'anyone', consumerKey: 'annotateit', admin: true});
      return assert.isTrue(permissions.authorize('read', a));
    });
  });
});
