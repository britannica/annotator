/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Plugin.Tags', function() {
  let annotator = null;
  let plugin = null;

  beforeEach(function() {
    const el = $("<div><div class='annotator-editor-controls'></div></div>")[0];
    annotator = new Annotator($('<div/>')[0]);
    plugin = new Annotator.Plugin.Tags(el);
    plugin.annotator = annotator;
    return plugin.pluginInit();
  });

  it("should parse whitespace-delimited tags into an array", function() {
    const str = 'one two  three\tfourFive';
    return assert.deepEqual(plugin.parseTags(str), ['one', 'two', 'three', 'fourFive']);
  });

  it("should stringify a tags array into a space-delimited string", function() {
    const ary = ['one', 'two', 'three'];
    return assert.equal(plugin.stringifyTags(ary), "one two three");
  });

  describe("pluginInit", function() {
    it("should add a field to the editor", function() {
      sinon.spy(annotator.editor, 'addField');
      plugin.pluginInit();
      return assert(annotator.editor.addField.calledOnce);
    });

    return it("should register a filter if the Filter plugin is loaded", function() {
      plugin.annotator.plugins.Filter = {addFilter: sinon.spy()};
      plugin.pluginInit();
      return assert(plugin.annotator.plugins.Filter.addFilter.calledOnce);
    });
  });

  describe("updateField", function() {
    it("should set the value of the input", function() {
      const annotation = {tags: ['apples', 'oranges', 'pears']};
      plugin.updateField(plugin.field, annotation);

      return assert.equal(plugin.input.val(), 'apples oranges pears');
    });

    return it("should set the clear the value of the input if there are no tags", function() {
      const annotation = {};
      plugin.input.val('apples pears oranges');
      plugin.updateField(plugin.field, annotation);

      return assert.equal(plugin.input.val(), '');
    });
  });

  describe("setAnnotationTags", () =>
    it("should set the annotation's tags", function() {
      const annotation = {};
      plugin.input.val('apples oranges pears');
      plugin.setAnnotationTags(plugin.field, annotation);

      return assert.deepEqual(annotation.tags, ['apples', 'oranges', 'pears']);
    })
  );

  return describe("updateViewer", function() {
    it("should insert the tags into the field", function() {
      const annotation = { tags: ['foo', 'bar', 'baz'] };
      const field = $('<div />')[0];

      plugin.updateViewer(field, annotation);
      return assert.deepEqual($(field).html(), [
        '<span class="annotator-tag">foo</span>',
        '<span class="annotator-tag">bar</span>',
        '<span class="annotator-tag">baz</span>'
      ].join(' '));
    });

    return it("should remove the field if there are no tags", function() {
      let annotation = { tags: [] };
      let field = $('<div />')[0];

      plugin.updateViewer(field, annotation);
      assert.lengthOf($(field).parent(), 0);

      annotation = {};
      field = $('<div />')[0];

      plugin.updateViewer(field, annotation);
      return assert.lengthOf($(field).parent(), 0);
    });
  });
});


describe('Annotator.Plugin.Tags.filterCallback', function() {
  let filter = null;
  beforeEach(() => filter = Annotator.Plugin.Tags.filterCallback);

  it('should return true if all tags are matched by keywords', function() {
    assert.isTrue(filter('cat dog mouse', ['cat', 'dog', 'mouse']));
    return assert.isTrue(filter('cat dog', ['cat', 'dog', 'mouse']));
  });

  return it('should NOT return true if all tags are NOT matched by keywords', function() {
    assert.isFalse(filter('cat dog', ['cat']));
    return assert.isFalse(filter('cat dog', []));
  });
});
