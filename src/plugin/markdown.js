/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Plugin that renders annotation comments displayed in the Viewer in Markdown.
// Requires Showdown library to be present in the page when initialised.
const Cls = (Annotator.Plugin.Markdown = class Markdown extends Annotator.Plugin {
  static initClass() {
    // Events to be bound to the @element.
    this.prototype.events =
      {'annotationViewerTextField': 'updateTextField'};
  }

  // Public: Initailises an instance of the Markdown plugin.
  //
  // element - The Annotator#element.
  // options - An options Object (there are currently no options).
  //
  // Examples
  //
  //   plugin = new Annotator.Plugin.Markdown(annotator.element)
  //
  // Returns a new instance of Annotator.Plugin.Markdown.
  constructor(element, options) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.updateTextField = this.updateTextField.bind(this);
    if ((typeof Showdown !== 'undefined' && Showdown !== null ? Showdown.converter : undefined) != null) {
      super(...arguments);
      this.converter = new Showdown.converter();
    } else {
      console.error(Annotator._t("To use the Markdown plugin, you must include Showdown into the page first."));
    }
  }

  // Annotator event callback. Displays the annotation.text as a Markdown
  // rendered version.
  //
  // field      - The viewer field Element.
  // annotation - The annotation Object being displayed.
  //
  // Examples
  //
  //   # Normally called by Annotator#viewer()
  //   plugin.updateTextField(field, {text: 'My _markdown_ comment'})
  //   $(field).html() # => Returns "My <em>markdown</em> comment"
  //
  // Returns nothing
  updateTextField(field, annotation) {
    // Escape any HTML in the text to prevent XSS.
    const text = Annotator.Util.escape(annotation.text || '');
    return $(field).html(this.convert(text));
  }

  // Converts provided text into markdown.
  //
  // text - A String of Markdown to render as HTML.
  //
  // Examples
  //
  // plugin.convert('This is _very_ basic [Markdown](http://daringfireball.com)')
  // # => Returns "This is <em>very<em> basic <a href="http://...">Markdown</a>"
  //
  // Returns HTML string.
  convert(text) {
    return this.converter.makeHtml(text);
  }
});
Cls.initClass();
