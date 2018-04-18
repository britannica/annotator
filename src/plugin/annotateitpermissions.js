/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Public: Plugin for managing user permissions under the rather more specialised
// permissions model used by [AnnotateIt](http://annotateit.org).
//
// element - A DOM Element upon which events are bound. When initialised by
//           the Annotator it is the Annotator element.
// options - An Object literal containing custom options.
//
// Examples
//
//   new Annotator.plugin.AnnotateItPermissions(annotator.element)
//
// Returns a new instance of the AnnotateItPermissions Object.
const Cls = (Annotator.Plugin.AnnotateItPermissions = class AnnotateItPermissions extends Annotator.Plugin.Permissions {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.addFieldsToAnnotation = this.addFieldsToAnnotation.bind(this);
    this.updatePermissionsField = this.updatePermissionsField.bind(this);
    this.updateAnnotationPermissions = this.updateAnnotationPermissions.bind(this);
    this._setAuthFromToken = this._setAuthFromToken.bind(this);
    super(...args);
  }

  static initClass() {
  
    // A Object literal of default options for the class.
    this.prototype.options = {
  
      // Displays an "Anyone can view this annotation" checkbox in the Editor.
      showViewPermissionsCheckbox: true,
  
      // Displays an "Anyone can edit this annotation" checkbox in the Editor.
      showEditPermissionsCheckbox: true,
  
      // Abstract user groups used by userAuthorize function
      groups: {
        world: 'group:__world__',
        authenticated: 'group:__authenticated__',
        consumer: 'group:__consumer__'
      },
  
      userId(user) { return user.userId; },
      userString(user) { return user.userId; },
  
      // Public: Used by AnnotateItPermissions#authorize to determine whether a user can
      // perform an action on an annotation.
      //
      // This should do more-or-less the same thing as the server-side authorization
      // code, which is to be found at
      //   https://github.com/okfn/annotator-store/blob/master/annotator/authz.py
      //
      // Returns a Boolean, true if the user is authorised for the action provided.
      userAuthorize(action, annotation, user) {
        const permissions = annotation.permissions || {};
        const action_field = permissions[action] || [];
  
        if (Array.from(action_field).includes(this.groups.world)) {
          return true;
  
        } else if ((user != null) && (user.userId != null) && (user.consumerKey != null)) {
          if ((user.userId === annotation.user) && (user.consumerKey === annotation.consumer)) {
            return true;
          } else if (Array.from(action_field).includes(this.groups.authenticated)) {
            return true;
          } else if ((user.consumerKey === annotation.consumer) && Array.from(action_field).includes(this.groups.consumer)) {
            return true;
          } else if ((user.consumerKey === annotation.consumer) && Array.from(action_field).includes(user.userId)) {
            return true;
          } else if ((user.consumerKey === annotation.consumer) && user.admin) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      },
  
      // Default permissions for all annotations. Anyone can
      // read, but only annotation owners can update/delete/admin.
      permissions: {
        'read':   ['group:__world__'],
        'update': [],
        'delete': [],
        'admin':  []
      }
    };
  }

  // Event callback: Appends the @options.permissions, @options.user and
  // @options.consumer objects to the provided annotation object.
  //
  // annotation - An annotation object.
  //
  // Examples
  //
  //   annotation = {text: 'My comment'}
  //   permissions.addFieldsToAnnotation(annotation)
  //   console.log(annotation)
  //   # => {text: 'My comment', user: 'alice', consumer: 'annotateit', permissions: {...}}
  //
  // Returns nothing.
  addFieldsToAnnotation(annotation) {
    if (annotation) {
      annotation.permissions = this.options.permissions;
      if (this.user) {
        annotation.user = this.user.userId;
        return annotation.consumer = this.user.consumerKey;
      }
    }
  }

  // Field callback: Updates the state of the "anyone can…" checkboxes
  //
  // action     - The action String, either "view" or "update"
  // field      - A DOM Element containing a form input.
  // annotation - An annotation Object.
  //
  // Returns nothing.
  updatePermissionsField(action, field, annotation) {
    field = $(field).show();
    const input = field.find('input').removeAttr('disabled');

    // Do not show field if current user is not admin.
    if (!this.authorize('admin', annotation)) { field.hide(); }

    // See if we can authorise with any old user from this consumer
    if (this.user && this.authorize(action, annotation || {}, {userId: '__nonexistentuser__', consumerKey: this.user.consumerKey})) {
      return input.attr('checked', 'checked');
    } else {
      return input.removeAttr('checked');
    }
  }

  // Field callback: updates the annotation.permissions object based on the state
  // of the field checkbox. If it is checked then permissions are set to world
  // writable otherwise they use the original settings.
  //
  // action     - The action String, either "view" or "update"
  // field      - A DOM Element representing the annotation editor.
  // annotation - An annotation Object.
  //
  // Returns nothing.
  updateAnnotationPermissions(type, field, annotation) {
    if (!annotation.permissions) { annotation.permissions = this.options.permissions; }

    const dataKey = type + '-permissions';

    if ($(field).find('input').is(':checked')) {
      return annotation.permissions[type] = [type === 'read' ? this.options.groups.world : this.options.groups.consumer];
    } else {
      return annotation.permissions[type] = [];
    }
  }

  // Sets the Permissions#user property on the basis of a received authToken. This plugin
  // simply uses the entire token to represent the user.
  //
  // token - the authToken received by the Auth plugin
  //
  // Returns nothing.
  _setAuthFromToken(token) {
    return this.setUser(token);
  }
});
Cls.initClass();
