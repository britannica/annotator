/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Plugin.Permissions', function() {
  let el = null;
  let permissions = null;

  beforeEach(function() {
    el = $("<div class='annotator-viewer'></div>").appendTo('body')[0];
    return permissions = new Annotator.Plugin.Permissions(el);
  });

  afterEach(() => $(el).remove());

  it("it should add the current user object to newly created annotations on beforeAnnotationCreated", function() {
    let ann = {};
    $(el).trigger('beforeAnnotationCreated', [ann]);
    assert.isUndefined(ann.user);

    ann = {};
    permissions.setUser('alice');
    $(el).trigger('beforeAnnotationCreated', [ann]);
    assert.equal(ann.user, 'alice');

    ann = {};
    permissions.setUser({id: 'alice'});
    permissions.options.userId = user => user.id;
    $(el).trigger('beforeAnnotationCreated', [ann]);
    return assert.deepEqual(ann.user, {id: 'alice'});
  });

  it("it should add permissions to newly created annotations on beforeAnnotationCreated", function() {
    let ann = {};
    $(el).trigger('beforeAnnotationCreated', [ann]);
    assert.ok(ann.permissions);

    ann = {};
    permissions.options.permissions = {};
    $(el).trigger('beforeAnnotationCreated', [ann]);
    return assert.deepEqual(ann.permissions, {});
  });

  describe('pluginInit', function() {
    beforeEach(() =>
      permissions.annotator = {
        viewer: {
          addField: sinon.spy()
        },
        editor: {
          addField: sinon.spy()
        },
        plugins: {}
      });

    it("should register a field with the Viewer", function() {
      permissions.pluginInit();
      return assert(permissions.annotator.viewer.addField.calledOnce);
    });

    it("should register an two checkbox fields with the Editor", function() {
      permissions.pluginInit();
      return assert.equal(permissions.annotator.editor.addField.callCount, 2);
    });

    it("should register an 'anyone can view' field with the Editor if showEditPermissionsCheckbox is true", function() {
      permissions.options.showViewPermissionsCheckbox = true;
      permissions.options.showEditPermissionsCheckbox = false;
      permissions.pluginInit();
      return assert.equal(permissions.annotator.editor.addField.callCount, 1);
    });

    it("should register an 'anyone can edit' field with the Editor if showViewPermissionsCheckbox is true", function() {
      permissions.options.showViewPermissionsCheckbox = false;
      permissions.options.showEditPermissionsCheckbox = true;
      permissions.pluginInit();
      return assert.equal(permissions.annotator.editor.addField.callCount, 1);
    });

    return it("should register a filter if the Filter plugin is loaded", function() {
      permissions.annotator.plugins.Filter = {addFilter: sinon.spy()};
      permissions.pluginInit();
      return assert(permissions.annotator.plugins.Filter.addFilter.calledOnce);
    });
  });

  describe('authorize', function() {
    let annotations = null;

    describe('Basic usage', function() {

      beforeEach(() =>
        annotations = [
          {},                  // Everything should be allowed

          { user: 'alice' },   // Only alice should be allowed to edit/delete.

          { permissions: {} }, // Everything should be allowed.

          { permissions: {    // Anyone can read/edit/delete.
            'update': []
          } }
        ]);

      it('should allow any action for an annotation with no authorisation info', function() {
        const a = annotations[0];
        assert.isTrue(permissions.authorize(null,  a));
        assert.isTrue(permissions.authorize('foo', a));
        permissions.setUser('alice');
        assert.isTrue(permissions.authorize(null,  a));
        return assert.isTrue(permissions.authorize('foo', a));
      });

      it('should NOT allow any action if annotation.user and no @user is set', function() {
        const a = annotations[1];
        assert.isFalse(permissions.authorize(null,  a));
        return assert.isFalse(permissions.authorize('foo', a));
      });

      it('should allow any action if @options.userId(@user) == annotation.user', function() {
        const a = annotations[1];
        permissions.setUser('alice');
        assert.isTrue(permissions.authorize(null,  a));
        return assert.isTrue(permissions.authorize('foo', a));
      });

      it('should NOT allow any action if @options.userId(@user) != annotation.user', function() {
        const a = annotations[1];
        permissions.setUser('bob');
        assert.isFalse(permissions.authorize(null,  a));
        return assert.isFalse(permissions.authorize('foo', a));
      });

      it('should allow any action if annotation.permissions == {}', function() {
        const a = annotations[2];
        assert.isTrue(permissions.authorize(null,  a));
        assert.isTrue(permissions.authorize('foo', a));
        permissions.setUser('alice');
        assert.isTrue(permissions.authorize(null,  a));
        return assert.isTrue(permissions.authorize('foo', a));
      });

      return it('should allow an action if annotation.permissions[action] == []', function() {
        const a = annotations[3];
        assert.isTrue(permissions.authorize('update', a));
        permissions.setUser('bob');
        return assert.isTrue(permissions.authorize('update', a));
      });
    });

    return describe('Custom options.userAuthorize() callback', function() {

      beforeEach(function() {
        permissions.setUser(null);

        // Define a custom userAuthorize method to allow a more complex system
        //
        // This test is to ensure that the Permissions plugin can still handle
        // users and groups as it did in a legacy version (commit fc22b76 and
        // earlier).
        //
        // Here we allow custom permissions tokens that can handle both users
        // and groups in the form "user:username" and "group:groupname". We
        // then proved an options.userAuthorize() method that recieves a user
        // and token and returns true if the current user meets the requirements
        // set by the token.
        //
        // In this example it is assumed that all users (if present) are objects
        // with an "id" and optional "groups" property. The group will default
        // to "public" which means anyone can edit it.
        permissions.options.userAuthorize = function(action, annotation, user) {
          const userGroups = user => (user != null ? user.groups : undefined) || ['public'];

          const tokenTest = function(token, user) {
            if (/^(?:group|user):/.test(token)) {
              const [key, ...values] = Array.from(token.split(':'));
              const value = values.join(':');

              if (key === 'group') {
                const groups = userGroups(user);
                return Array.from(groups).includes(value);

              } else if (user && (key === 'user')) {
                return value === user.id;
              }
            }
          };

          if (annotation.permissions) {
            const tokens = annotation.permissions[action] || [];

            for (let token of Array.from(tokens)) {
              if (tokenTest(token, user)) {
                return true;
              }
            }
          }

          return false;
        };

        return annotations = [
          { permissions: {    // Anyone can update, assuming default @options.userGroups.
            'update': ['group:public']
          } },

          { permissions: {    // Only alice can update.
            'update': ['user:alice']
          } },

          { permissions: {    // alice and bob can both update.
            'update': ['user:alice', 'user:bob']
          } },

          { permissions: {    // alice and bob can both update. Anyone for whom
                              // @options.userGroups(user) includes 'admin' can
                              // also update.
            'update': ['user:alice', 'user:bob', 'group:admin']
          } }
        ];});

      afterEach(() => delete permissions.options.userAuthorize);

      it('should (by default) allow an action if annotation.permissions[action] includes "group:public"', function() {
        const a = annotations[0];
        assert.isTrue(permissions.authorize('update', a));
        permissions.setUser({id: 'bob'});
        return assert.isTrue(permissions.authorize('update', a));
      });

      it('should (by default) allow an action if annotation.permissions[action] includes "user:@user"', function() {
        let a = annotations[1];
        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'bob'});
        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'alice'});
        assert.isTrue(permissions.authorize('update', a));

        a = annotations[2];
        permissions.setUser(null);
        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'bob'});
        assert.isTrue(permissions.authorize('update', a));
        permissions.setUser({id: 'alice'});
        return assert.isTrue(permissions.authorize('update', a));
      });

      it('should allow an action if annotation.permissions[action] includes "user:@options.userId(@user)"', function() {
        const a = annotations[1];
        permissions.options.userId = user => (user != null ? user.id : undefined) || null;

        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'alice'});
        return assert.isTrue(permissions.authorize('update', a));
      });

      return it('should allow an action if annotation.permissions[action] includes "user:@options.userId(@user)"', function() {
        const a = annotations[3];

        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'foo', groups: ['other']});
        assert.isFalse(permissions.authorize('update', a));
        permissions.setUser({id: 'charlie', groups: ['admin']});
        return assert.isTrue(permissions.authorize('update', a));
      });
    });
  });

  describe('updateAnnotationPermissions', function() {
    let field = null;
    let checkbox = null;
    let annotation = null;

    beforeEach(function() {
      checkbox = $('<input type="checkbox" />');
      field = $('<li />').append(checkbox)[0];

      return annotation = {permissions: {'update': ['Alice']}};});

    it("should NOT be world editable when 'Anyone can edit' checkbox is unchecked", function() {
      checkbox.removeAttr('checked');
      permissions.updateAnnotationPermissions('update', field, annotation);
      return assert.isFalse(permissions.authorize('update', annotation, null));
    });

    it("should be world editable when 'Anyone can edit' checkbox is checked", function() {
      checkbox.attr('checked', 'checked');
      permissions.updateAnnotationPermissions('update', field, annotation);
      return assert.isTrue(permissions.authorize('update', annotation, null));
    });

    it("should NOT be world editable when 'Anyone can edit' checkbox is unchecked for a second time", function() {
      checkbox.attr('checked', 'checked');
      permissions.updateAnnotationPermissions('update', field, annotation);
      assert.isTrue(permissions.authorize('update', annotation, null));

      checkbox.removeAttr('checked');
      permissions.updateAnnotationPermissions('update', field, annotation);
      return assert.isFalse(permissions.authorize('update', annotation, null));
    });
      
    return it('should consult the userId option when updating permissions', function() {
      annotation = {permissions: {}};
      permissions.options.userId = user => user.id;
      permissions.setUser({id: 3, name: 'Alice'});
      permissions.updateAnnotationPermissions('update', field, annotation);
      return assert.deepEqual(annotation.permissions, {'update': [3]});
    });
  });

  describe('updatePermissionsField', function() {
    let field = null;
    let checkbox = null;
    const annotations = [
      {},
      {permissions: {'update': ['user:Alice']}},
      {permissions: {'update': ['user:Alice']}},
      {permissions: {'update': ['Alice'], 'admin': ['Alice']}},
      {permissions: {'update': ['Alice'], 'admin': ['Bob']}}
    ];

    beforeEach(function() {
      checkbox = $('<input type="checkbox" />');
      field = $('<li />').append(checkbox).appendTo(permissions.element);

      permissions.setUser('Alice');
      return permissions.updatePermissionsField('update', field, annotations.shift());
    });

    afterEach(() => field.remove());

    it("should have a checked checkbox when there are no permissions", () => assert.isTrue(checkbox.is(':checked')));

    it("should have an unchecked checkbox when there are permissions", () => assert.isFalse(checkbox.is(':checked')));

    it("should enable the checkbox by default", () => assert.isTrue(checkbox.is(':enabled')));

    it("should display the field if the current user has 'admin' permissions", () => assert.isTrue(field.is(':visible')));

    return it("should NOT display the field if the current user does not have 'admin' permissions", () => assert.isFalse(field.is(':visible')));
  });

  return describe('updateViewer', function() {
    let controls = null;
    let field = null;

    beforeEach(function() {
      field = $('<div />').appendTo('<div />')[0];
      return controls = {
        showEdit:   sinon.spy(),
        hideEdit:   sinon.spy(),
        showDelete: sinon.spy(),
        hideDelete: sinon.spy()
      };});

    describe('coarse grained updates based on user', function() {
      let annotations = null;

      beforeEach(function() {
        permissions.setUser('alice');
        return annotations = [{user: 'alice'}, {user: 'bob'}, {}];});

      it("it should display annotations' users in the viewer element", function() {
        permissions.updateViewer(field, annotations[0], controls);
        assert.equal($(field).html(), 'alice');
        return assert.lengthOf($(field).parent(), 1);
      });

      it("it should remove the field if annotation has no user", function() {
        permissions.updateViewer(field, {}, controls);
        return assert.lengthOf($(field).parent(), 0);
      });

      it("it should remove the field if annotation has no user string", function() {
        permissions.options.userString = () => null;

        permissions.updateViewer(field, annotations[1], controls);
        return assert.lengthOf($(field).parent(), 0);
      });

      it("it should remove the field if annotation has empty user string", function() {
        permissions.options.userString = () => '';
        permissions.updateViewer(field, annotations[1], controls);
        return assert.lengthOf($(field).parent(), 0);
      });

      it("should hide controls for users other than the current user", function() {
        permissions.updateViewer(field, annotations[0], controls);
        assert.isFalse(controls.hideEdit.called);
        assert.isFalse(controls.hideDelete.called);

        permissions.updateViewer(field, annotations[1], controls);
        assert(controls.hideEdit.calledOnce);
        return assert(controls.hideDelete.calledOnce);
      });

      return it("should show controls for annotations without a user", function() {
        permissions.updateViewer(field, annotations[2], controls);
        assert.isFalse(controls.hideEdit.called);
        return assert.isFalse(controls.hideDelete.called);
      });
    });

    return describe('fine-grained use (user and permissions)', function() {
      let annotations = null;

      beforeEach(function() {
        annotations = [
          {
            user: 'alice',
            permissions: {
              'update': ['alice'],
              'delete': ['alice']
            }
          },
          {
            user: 'bob',
            permissions: {
              'update': ['bob'],
              'delete': ['bob']
            }
          }
        ];

        return permissions.setUser('bob');
      });

      it("it should should hide edit button if user cannot update", function() {
        permissions.updateViewer(field, annotations[0], controls);
        return assert(controls.hideEdit.calledOnce);
      });

      it("it should should show edit button if user can update", function() {
        permissions.updateViewer(field, annotations[1], controls);
        return assert.isFalse(controls.hideEdit.called);
      });

      it("it should should hide delete button if user cannot delete", function() {
        permissions.updateViewer(field, annotations[0], controls);
        return assert(controls.hideDelete.calledOnce);
      });

      return it("it should should show delete button if user can delete", function() {
        permissions.updateViewer(field, annotations[1], controls);
        return assert.isFalse(controls.hideDelete.called);
      });
    });
  });
});
