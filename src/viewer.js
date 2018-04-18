/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Public: Creates an element for viewing annotations.
const Cls = (Annotator.Viewer = class Viewer extends Annotator.Widget {
  static initClass() {
  
    // Events to be bound to the @element.
    this.prototype.events = {
      ".annotator-edit click":   "onEditClick",
      ".annotator-delete click": "onDeleteClick"
    };
  
    // Classes for toggling annotator state.
    this.prototype.classes = {
      hide: 'annotator-hide',
      showControls: 'annotator-visible'
    };
  
    // HTML templates for @element and @item properties.
    this.prototype.html = {
      element:`\
<div class="annotator-outer annotator-viewer">
  <ul class="annotator-widget annotator-listing"></ul>
</div>\
`,
      item:   `\
<li class="annotator-annotation annotator-item">
  <span class="annotator-controls">
    <a href="#" title="View as webpage" class="annotator-link">View as webpage</a>
    <button title="Edit" class="annotator-edit">Edit</button>
    <button title="Delete" class="annotator-delete">Delete</button>
  </span>
</li>\
`
    };
  
    // Configuration options
    this.prototype.options =
      {readOnly: false};
     // Start the viewer in read-only mode. No controls will be shown.
  }

  // Public: Creates an instance of the Viewer object. This will create the
  // @element from the @html.element string and set up all events.
  //
  // options - An Object literal containing options.
  //
  // Examples
  //
  //   # Creates a new viewer, adds a custom field and displays an annotation.
  //   viewer = new Annotator.Viewer()
  //   viewer.addField({
  //     load: someLoadCallback
  //   })
  //   viewer.load(annotation)
  //
  // Returns a new Viewer instance.
  constructor(options) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.load = this.load.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    super($(this.html.element)[0], options);

    this.item   = $(this.html.item)[0];
    this.fields = [];
    this.annotations = [];
  }

  // Public: Displays the Viewer and first the "show" event. Can be used as an
  // event callback and will call Event#preventDefault() on the supplied event.
  //
  // event - Event object provided if method is called by event
  //         listener (default:undefined)
  //
  // Examples
  //
  //   # Displays the editor.
  //   viewer.show()
  //
  //   # Displays the viewer on click (prevents default action).
  //   $('a.show-viewer').bind('click', viewer.show)
  //
  // Returns itself.
  show(event) {
    Annotator.Util.preventEventDefault(event);

    const controls = this.element
      .find('.annotator-controls')
      .addClass(this.classes.showControls);
    setTimeout((() => controls.removeClass(this.classes.showControls)), 500);

    this.element.removeClass(this.classes.hide);
    return this.checkOrientation().publish('show');
  }

  // Public: Checks to see if the Viewer is currently displayed.
  //
  // Examples
  //
  //   viewer.show()
  //   viewer.isShown() # => Returns true
  //
  //   viewer.hide()
  //   viewer.isShown() # => Returns false
  //
  // Returns true if the Viewer is visible.
  isShown() {
    return !this.element.hasClass(this.classes.hide);
  }

  // Public: Hides the Editor and fires the "hide" event. Can be used as an event
  // callback and will call Event#preventDefault() on the supplied event.
  //
  // event - Event object provided if method is called by event
  //         listener (default:undefined)
  //
  // Examples
  //
  //   # Hides the editor.
  //   viewer.hide()
  //
  //   # Hide the viewer on click (prevents default action).
  //   $('a.hide-viewer').bind('click', viewer.hide)
  //
  // Returns itself.
  hide(event) {
    Annotator.Util.preventEventDefault(event);

    this.element.addClass(this.classes.hide);
    return this.publish('hide');
  }

  // Public: Loads annotations into the viewer and shows it. Fires the "load"
  // event once the viewer is loaded passing the annotations into the callback.
  //
  // annotation - An Array of annotation elements.
  //
  // Examples
  //
  //   viewer.load([annotation1, annotation2, annotation3])
  //
  // Returns itslef.
  load(annotations) {
    this.annotations = annotations || [];

    const list = this.element.find('ul:first').empty();
    for (let annotation of Array.from(this.annotations)) {
      var controller;
      const item = $(this.item).clone().appendTo(list).data('annotation', annotation);
      const controls = item.find('.annotator-controls');

      const link = controls.find('.annotator-link');
      var edit = controls.find('.annotator-edit');
      var del  = controls.find('.annotator-delete');

      const links = new LinkParser(annotation.links || []).get('alternate', {'type': 'text/html'});
      if ((links.length === 0) || (links[0].href == null)) {
        link.remove();
      } else {
        link.attr('href', links[0].href);
      }

      if (this.options.readOnly) {
        edit.remove();
        del.remove();
      } else {
        controller = {
          showEdit() { return edit.removeAttr('disabled'); },
          hideEdit() { return edit.attr('disabled', 'disabled'); },
          showDelete() { return del.removeAttr('disabled'); },
          hideDelete() { return del.attr('disabled', 'disabled'); }
        };
      }

      for (let field of Array.from(this.fields)) {
        const element = $(field.element).clone().appendTo(item)[0];
        field.load(element, annotation, controller);
      }
    }

    this.publish('load', [this.annotations]);

    return this.show();
  }

  // Public: Adds an addional field to an annotation view. A callback can be
  // provided to update the view on load.
  //
  // options - An options Object. Options are as follows:
  //           load - Callback Function called when the view is loaded with an
  //                  annotation. Recieves a newly created clone of @item and
  //                  the annotation to be displayed (it will be called once
  //                  for each annotation being loaded).
  //
  // Examples
  //
  //   # Display a user name.
  //   viewer.addField({
  //     # This is called when the viewer is loaded.
  //     load: (field, annotation) ->
  //       field = $(field)
  //
  //       if annotation.user
  //         field.text(annotation.user) # Display the user
  //       else
  //         field.remove()              # Do not display the field.
  //   })
  //
  // Returns itself.
  addField(options) {
    const field = $.extend({
      load() {}
    }, options);

    field.element = $('<div />')[0];
    this.fields.push(field);
    field.element;
    return this;
  }

  // Callback function: called when the edit button is clicked.
  //
  // event - An Event object.
  //
  // Returns nothing.
  onEditClick(event) {
    return this.onButtonClick(event, 'edit');
  }

  // Callback function: called when the delete button is clicked.
  //
  // event - An Event object.
  //
  // Returns nothing.
  onDeleteClick(event) {
    return this.onButtonClick(event, 'delete');
  }

  // Fires an event of type and passes in the associated annotation.
  //
  // event - An Event object.
  // type  - The type of event to fire. Either "edit" or "delete".
  //
  // Returns nothing.
  onButtonClick(event, type) {
    const item = $(event.target).parents('.annotator-annotation');

    return this.publish(type, [item.data('annotation')]);
  }
});
Cls.initClass();

// Private: simple parser for hypermedia link structure
//
// Examples:
//
//   links = [
//     { rel: 'alternate', href: 'http://example.com/pages/14.json', type: 'application/json' },
//     { rel: 'prev': href: 'http://example.com/pages/13' }
//   ]
//
//   lp = LinkParser(links)
//   lp.get('alternate')                      # => [ { rel: 'alternate', href: 'http://...', ... } ]
//   lp.get('alternate', {type: 'text/html'}) # => []
//
class LinkParser {
  constructor(data) {
    this.data = data;
  }

  get(rel, cond) {
    let k;
    if (cond == null) { cond = {}; }
    cond = $.extend({}, cond, {rel});
    const keys = ((() => {
      const result = [];
      for (k of Object.keys(cond || {})) {
        const v = cond[k];
        result.push(k);
      }
      return result;
    })());
    return (() => {
      const result1 = [];
      for (var d of Array.from(this.data)) {
        const match = keys.reduce(((m, k) => m && (d[k] === cond[k])), true);
        if (match) {
          result1.push(d);
        } else {
          continue;
        }
      }
      return result1;
    })();
  }
}
