/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Public: Tags plugin allows users to tag thier annotations with metadata
// stored in an Array on the annotation as tags.
const Cls = (Annotator.Plugin.Tags = class Tags extends Annotator.Plugin {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.updateField = this.updateField.bind(this);
    this.setAnnotationTags = this.setAnnotationTags.bind(this);
    super(...args);
  }

  static initClass() {
  
    this.prototype.options = {
      // Configurable function which accepts a string (the contents)
      // of the tags input as an argument, and returns an array of
      // tags.
      parseTags(string) {
        string = $.trim(string);
  
        let tags = [];
        if (string) { tags = string.split(/\s+/); }
        return tags;
      },
  
      // Configurable function which accepts an array of tags and
      // returns a string which will be used to fill the tags input.
      stringifyTags(array) {
        return array.join(" ");
      }
    };
  
    // The field element added to the Annotator.Editor wrapped in jQuery. Cached to
    // save having to recreate it everytime the editor is displayed.
    this.prototype.field = null;
  
    // The input element added to the Annotator.Editor wrapped in jQuery. Cached to
    // save having to recreate it everytime the editor is displayed.
    this.prototype.input = null;
  }

  // Public: Initialises the plugin and adds custom fields to both the
  // annotator viewer and editor. The plugin also checks if the annotator is
  // supported by the current browser.
  //
  // Returns nothing.
  pluginInit() {
    if (!Annotator.supported()) { return; }

    this.field = this.annotator.editor.addField({
      label:  Annotator._t('Add some tags here') + '\u2026',
      load:   this.updateField,
      submit: this.setAnnotationTags
    });

    this.annotator.viewer.addField({
      load: this.updateViewer
    });

    // Add a filter to the Filter plugin if loaded.
    if (this.annotator.plugins.Filter) {
      this.annotator.plugins.Filter.addFilter({
        label: Annotator._t('Tag'),
        property: 'tags',
        isFiltered: Annotator.Plugin.Tags.filterCallback
      });
    }

    return this.input = $(this.field).find(':input');
  }

  // Public: Extracts tags from the provided String.
  //
  // string - A String of tags seperated by spaces.
  //
  // Examples
  //
  //   plugin.parseTags('cake chocolate cabbage')
  //   # => ['cake', 'chocolate', 'cabbage']
  //
  // Returns Array of parsed tags.
  parseTags(string) {
    return this.options.parseTags(string);
  }

  // Public: Takes an array of tags and serialises them into a String.
  //
  // array - An Array of tags.
  //
  // Examples
  //
  //   plugin.stringifyTags(['cake', 'chocolate', 'cabbage'])
  //   # => 'cake chocolate cabbage'
  //
  // Returns Array of parsed tags.
  stringifyTags(array) {
    return this.options.stringifyTags(array);
  }

  // Annotator.Editor callback function. Updates the @input field with the
  // tags attached to the provided annotation.
  //
  // field      - The tags field Element containing the input Element.
  // annotation - An annotation object to be edited.
  //
  // Examples
  //
  //   field = $('<li><input /></li>')[0]
  //   plugin.updateField(field, {tags: ['apples', 'oranges', 'cake']})
  //   field.value # => Returns 'apples oranges cake'
  //
  // Returns nothing.
  updateField(field, annotation) {
    let value = '';
    if (annotation.tags) { value = this.stringifyTags(annotation.tags); }

    return this.input.val(value);
  }

  // Annotator.Editor callback function. Updates the annotation field with the
  // data retrieved from the @input property.
  //
  // field      - The tags field Element containing the input Element.
  // annotation - An annotation object to be updated.
  //
  // Examples
  //
  //   annotation = {}
  //   field = $('<li><input value="cake chocolate cabbage" /></li>')[0]
  //
  //   plugin.setAnnotationTags(field, annotation)
  //   annotation.tags # => Returns ['cake', 'chocolate', 'cabbage']
  //
  // Returns nothing.
  setAnnotationTags(field, annotation) {
    return annotation.tags = this.parseTags(this.input.val());
  }

  // Annotator.Viewer callback function. Updates the annotation display with tags
  // removes the field from the Viewer if there are no tags to display.
  //
  // field      - The Element to populate with tags.
  // annotation - An annotation object to be display.
  //
  // Examples
  //
  //   field = $('<div />')[0]
  //   plugin.updateField(field, {tags: ['apples']})
  //   field.innerHTML # => Returns '<span class="annotator-tag">apples</span>'
  //
  // Returns nothing.
  updateViewer(field, annotation) {
    field = $(field);

    if (annotation.tags && $.isArray(annotation.tags) && annotation.tags.length) {
      return field.addClass('annotator-tags').html(function() {
        let string;
        return string = $.map(annotation.tags,tag => `<span class="annotator-tag">${Annotator.Util.escape(tag)}</span>`).join(' ');
      });
    } else {
      return field.remove();
    }
  }
});
Cls.initClass();

// Checks an input string of keywords against an array of tags. If the keywords
// match _all_ tags the function returns true. This should be used as a callback
// in the Filter plugin.
//
// input - A String of keywords from a input field.
//
// Examples
//
//   Tags.filterCallback('cat dog mouse', ['cat', 'dog', 'mouse']) //=> true
//   Tags.filterCallback('cat dog', ['cat', 'dog', 'mouse']) //=> true
//   Tags.filterCallback('cat dog', ['cat']) //=> false
//
// Returns true if the input keywords match all tags.
Annotator.Plugin.Tags.filterCallback = function(input, tags) {
  if (tags == null) { tags = []; }
  let matches  = 0;
  let keywords = [];
  if (input) {
    keywords = input.split(/\s+/g);
    for (let keyword of Array.from(keywords)) {
      if (tags.length) {
        for (let tag of Array.from(tags)) { if (tag.indexOf(keyword) !== -1) { matches += 1; } }
      }
    }
  }

  return matches === keywords.length;
};
