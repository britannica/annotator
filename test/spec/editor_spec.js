/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Editor', function() {
  let editor = null;

  beforeEach(() => editor = new Annotator.Editor());

  afterEach(() => editor.element.remove());

  it("should have an element property", function() {
    assert.ok(editor.element);
    return assert.isTrue(editor.element.hasClass('annotator-editor'));
  });

  describe("events", function() {
    it("should call Editor#submit() when the form is submitted", function() {
      sinon.spy(editor, 'submit');
      // Prevent the default form submission in the browser.
      editor.element.find('form').submit(e => e.preventDefault()).submit();
      return assert(editor.submit.calledOnce);
    });

    it("should call Editor#submit() when the save button is clicked", function() {
      sinon.spy(editor, 'submit');
      editor.element.find('.annotator-save').click();
      return assert(editor.submit.calledOnce);
    });

    it("should call Editor#hide() when the cancel button is clicked", function() {
      sinon.spy(editor, 'hide');
      editor.element.find('.annotator-cancel').click();
      return assert(editor.hide.calledOnce);
    });

    it("should call Editor#onCancelButtonMouseover() when mouse moves over cancel", function() {
      sinon.spy(editor, 'onCancelButtonMouseover');
      editor.element.find('.annotator-cancel').mouseover();
      return assert(editor.onCancelButtonMouseover.calledOnce);
    });

    return it("should call Editor#processKeypress() when a key is pressed in a textarea", function() {
      // Editor needs a text area field.
      editor.element.find('ul').append('<li><textarea></textarea></li>');

      sinon.spy(editor, 'processKeypress');
      editor.element.find('textarea').keydown();
      return assert(editor.processKeypress.calledOnce);
    });
  });

  describe("show", function() {
    it("should make the editor visible", function() {
      editor.show();
      return assert.isFalse(editor.element.hasClass('annotator-hide'));
    });

    return it("should publish the 'show' event", function() {
      sinon.spy(editor, 'publish');
      editor.show();
      return assert.isTrue(editor.publish.calledWith('show'));
    });
  });

  describe("hide", function() {
    it("should hide the editor from view", function() {
      editor.hide();
      return assert.isTrue(editor.element.hasClass('annotator-hide'));
    });

    return it("should publish the 'show' event", function() {
      sinon.spy(editor, 'publish');
      editor.hide();
      return assert.isTrue(editor.publish.calledWith('hide'));
    });
  });

  describe("load", function() {
    beforeEach(function() {
      editor.annotation = {text: 'test'};
      return editor.fields = [
        {
          element: 'element0',
          load: sinon.spy()
        },
        {
          element: 'element1',
          load: sinon.spy()
        }
      ];});

      // TODO: investigate why the following tests fail (editor.load blocks)
      //       unless the following has been called.
      // sinon.spy(editor, 'show')

    it("should call #show()", function() {
      sinon.spy(editor, 'show');
      editor.load();
      return assert(editor.show.calledOnce);
    });

    it("should set the current annotation", function() {
      editor.load({text: 'Hello there'});
      return assert.equal(editor.annotation.text, 'Hello there');
    });

    it("should call the load callback on each field in the group", function() {
      editor.load();
      assert(editor.fields[0].load.calledOnce);
      return assert(editor.fields[1].load.calledOnce);
    });

    it("should pass the field element and an annotation to the callback", function() {
      editor.load();
      return assert(editor.fields[0].load.calledWith(editor.fields[0].element, editor.annotation));
    });

    return it("should publish the 'load' event", function() {
      sinon.spy(editor, 'publish');
      editor.load();
      return assert.isTrue(editor.publish.calledWith('load', [editor.annotation]));
    });
  });

  describe("submit", function() {
    beforeEach(function() {
      editor.annotation = {text: 'test'};
      return editor.fields = [
        {
          element: 'element0',
          submit: sinon.spy()
        },
        {
          element: 'element1',
          submit: sinon.spy()
        }
      ];});

    it("should call #hide()", function() {
      sinon.spy(editor, 'hide');
      editor.submit();
      return assert(editor.hide.calledOnce);
    });

    it("should call the submit callback on each field in the group", function() {
      editor.submit();
      assert(editor.fields[0].submit.calledOnce);
      return assert(editor.fields[1].submit.calledOnce);
    });

    it("should pass the field element and an annotation to the callback", function() {
      editor.submit();
      return assert(editor.fields[0].submit.calledWith(editor.fields[0].element, editor.annotation));
    });

    return it("should publish the 'save' event", function() {
      sinon.spy(editor, 'publish');
      editor.submit();
      return assert.isTrue(editor.publish.calledWith('save', [editor.annotation]));
    });
  });

  describe("addField", function() {
    let content = null;

    beforeEach(() => content = editor.element.children());

    afterEach(function() {
      editor.element.empty().append(content);
      return editor.fields = [];});

    it("should append a new field to the @fields property", function() {
      const { length } = editor.fields;

      editor.addField();
      assert.lengthOf(editor.fields, length + 1);

      editor.addField();
      return assert.lengthOf(editor.fields, length + 2);
    });

    it("should append a new list element to the editor", function() {
      const { length } = editor.element.find('li');

      editor.addField();
      assert.lengthOf(editor.element.find('li'), length + 1);

      editor.addField();
      return assert.lengthOf(editor.element.find('li'), length + 2);
    });

    it("should append an input element if no type is specified", function() {
      editor.addField();
      return assert.equal(editor.element.find('li:last :input').prop('type'), 'text');
    });

    it("should give each element a new id", function() {
      editor.addField();
      const firstID = editor.element.find('li:last :input').attr('id');

      editor.addField();
      const secondID = editor.element.find('li:last :input').attr('id');
      return assert.notEqual(firstID, secondID);
    });

    it("should append a textarea element if 'textarea' type is specified", function() {
      editor.addField({type: 'textarea'});
      return assert.equal(editor.element.find('li:last :input').prop('type'), 'textarea');
    });

    it("should append a checkbox element if 'checkbox' type is specified", function() {
      editor.addField({type: 'checkbox'});
      return assert.equal(editor.element.find('li:last :input').prop('type'), 'checkbox');
    });

    it("should append a label element with a for attribute matching the checkbox id", function() {
      editor.addField({type: 'checkbox'});
      return assert.equal(
        editor.element.find('li:last :input').attr('id'),
        editor.element.find('li:last label').attr('for')
      );
    });

    it("should set placeholder text if a label is provided", function() {
      editor.addField({type: 'textarea', label: 'Tags…'});
      return assert.equal(editor.element.find('li:last :input').attr('placeholder'), 'Tags…');
    });

    return it("should return the created list item", () => assert.equal(editor.addField().tagName, 'LI'));
  });

  describe("processKeypress", function() {
    beforeEach(function() {
      sinon.spy(editor, 'hide');
      return sinon.spy(editor, 'submit');
    });

    it("should call Editor#hide() if the escape key is pressed", function() {
      editor.processKeypress({keyCode: 27});
      return assert(editor.hide.calledOnce);
    });

    it("should call Editor#submit() if the enter key is pressed", function() {
      editor.processKeypress({keyCode: 13});
      return assert(editor.submit.calledOnce);
    });

    return it("should NOT call Editor#submit() if the shift key is held down", function() {
      editor.processKeypress({keyCode: 13, shiftKey: true});
      return assert.isFalse(editor.submit.called);
    });
  });

  return describe("onCancelButtonMouseover", () =>
    it("should remove the focus class from submit when cancel is hovered", function() {
      editor.element.find('.annotator-save').addClass('annotator-focus');
      editor.onCancelButtonMouseover();
      return assert.lengthOf(editor.element.find('.annotator-focus'), 0);
    })
  );
});
