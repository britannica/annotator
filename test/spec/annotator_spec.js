/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator', function() {
  let annotator = null;
  const mock = null;

  beforeEach(() => annotator = new Annotator($('<div></div>')[0], {}));
  afterEach(() => $(document).unbind());

  describe("events", function() {
    it("should call Annotator#onAdderClick() when adder is clicked", function() {
      const stub = sinon.stub(annotator, 'onAdderClick');

      annotator.element.find('.annotator-adder button').click();

      return assert(stub.calledOnce);
    });

    it("should call Annotator#onAdderMousedown() when mouse button is held down on adder", function() {
      const stub = sinon.stub(annotator, 'onAdderMousedown');

      annotator.element.find('.annotator-adder button').mousedown();

      return assert(stub.calledOnce);
    });

    it("should call Annotator#onHighlightMouseover() when mouse moves over a highlight", function() {
      const stub = sinon.stub(annotator, 'onHighlightMouseover');

      const highlight = $('<span class="annotator-hl" />').appendTo(annotator.element);
      highlight.mouseover();

      return assert(stub.calledOnce);
    });

    return it("should call Annotator#startViewerHideTimer() when mouse moves off a highlight", function() {
      const stub = sinon.stub(annotator, 'startViewerHideTimer');

      const highlight = $('<span class="annotator-hl" />').appendTo(annotator.element);
      highlight.mouseout();

      return assert(stub.calledOnce);
    });
  });

  describe("constructor", function() {
    beforeEach(function() {
      sinon.stub(annotator, '_setupWrapper').returns(annotator);
      sinon.stub(annotator, '_setupViewer').returns(annotator);
      sinon.stub(annotator, '_setupEditor').returns(annotator);
      sinon.stub(annotator, '_setupDocumentEvents').returns(annotator);
      return sinon.stub(annotator, '_setupDynamicStyle').returns(annotator);
    });

    it("should have a jQuery wrapper as @element", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert.instanceOf(annotator.element, $);
    });

    it("should create an empty @plugin object", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert.isTrue(annotator.hasOwnProperty('plugins'));
    });

    it("should create the adder properties from the @html strings", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert.instanceOf(annotator.adder, $);
    });

    it("should call Annotator#_setupWrapper()", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert(annotator._setupWrapper.called);
    });

    it("should call Annotator#_setupViewer()", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert(annotator._setupViewer.called);
    });

    it("should call Annotator#_setupEditor()", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert(annotator._setupEditor.called);
    });

    it("should call Annotator#_setupDocumentEvents()", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert(annotator._setupDocumentEvents.called);
    });

    it("should NOT call Annotator#_setupDocumentEvents() if options.readOnly is true", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0], {
        readOnly: true
      });
      return assert.isFalse(annotator._setupDocumentEvents.called);
    });

    return it("should call Annotator#_setupDynamicStyle()", function() {
      Annotator.prototype.constructor.call(annotator, annotator.element[0]);
      return assert(annotator._setupDynamicStyle.called);
    });
  });

  describe("#destroy()", function() {
    it("should unbind Annotator's events from the page", function() {
      const stub = sinon.stub(annotator, 'checkForStartSelection');

      annotator._setupDocumentEvents();
      annotator.destroy();
      $(document).mousedown();

      assert.isFalse(stub.called);
      return $(document).unbind('mousedown');
    });

    it("should remove Annotator's elements from the page", function() {
      annotator.destroy();
      return assert.equal(annotator.element.find('[class^=annotator-]').length, 0);
    });

    it("should call destroy on loaded plugins", function() {
      const spy = sinon.spy();
      annotator.myPlugin = {destroy: spy};
      annotator.destroy();
      return assert(spy);
    });

    return it("should not call destroy on a plugin that has not implemented the method", function() {
      annotator.plugins.myPlugin = {};
      return assert.doesNotThrow(() => annotator.destroy());
    });
  });

  describe("_setupDocumentEvents", function() {
    ({
      beforeEach() {
        return $(document).unbind('mouseup').unbind('mousedown');
      }
    });

    it("should call Annotator#checkForStartSelection() when mouse button is pressed", function() {
      const stub = sinon.stub(annotator, 'checkForStartSelection');
      annotator._setupDocumentEvents();
      $(document).mousedown();
      return assert(stub.calledOnce);
    });

    return it("should call Annotator#checkForEndSelection() when mouse button is lifted", function() {
      const stub = sinon.stub(annotator, 'checkForEndSelection');
      annotator._setupDocumentEvents();
      $(document).mouseup();
      return assert(stub.calledOnce);
    });
  });

  describe("_setupWrapper", function() {
    it("should wrap children of @element in the @html.wrapper element", function() {
      annotator.element = $('<div><span>contents</span></div>');
      annotator._setupWrapper();
      return assert.equal(annotator.wrapper.html(), '<span>contents</span>');
    });

    return it("should remove all script elements prior to wrapping", function() {
      const div = document.createElement('div');
      div.appendChild(document.createElement('script'));

      annotator.element = $(div);
      annotator._setupWrapper();

      return assert.equal(annotator.wrapper[0].innerHTML, '');
    });
  });

  describe("_setupViewer", function() {
    let mockViewer = null;

    beforeEach(function() {
      const element = $('<div />');

      mockViewer = {
        fields: [],
        element
      };

      mockViewer.on = () => mockViewer;
      mockViewer.hide = () => mockViewer;
      mockViewer.addField = function(options) {
        mockViewer.fields.push(options);
        return mockViewer;
      };

      sinon.spy(mockViewer, 'on');
      sinon.spy(mockViewer, 'hide');
      sinon.spy(mockViewer, 'addField');
      sinon.stub(element, 'bind').returns(element);
      sinon.stub(element, 'appendTo').returns(element);
      sinon.stub(Annotator, 'Viewer').returns(mockViewer);

      return annotator._setupViewer();
    });

    afterEach(() => Annotator.Viewer.restore());

    it("should create a new instance of Annotator.Viewer and set Annotator#viewer", () => assert.strictEqual(annotator.viewer, mockViewer));

    it("should hide the annotator on creation", () => assert(mockViewer.hide.calledOnce));

    it("should setup the default text field", function() {
      const args = mockViewer.addField.lastCall.args[0];

      assert(mockViewer.addField.calledOnce);
      return assert.equal(typeof args.load, "function");
    });

    it("should set the contents of the field on load", function() {
      const field = document.createElement('div');
      const annotation = {text: "test"};

      annotator.viewer.fields[0].load(field, annotation);
      return assert.equal(jQuery(field).html(), "test");
    });

    it("should set the contents of the field to placeholder text when empty", function() {
      const field = document.createElement('div');
      const annotation = {text: ""};

      annotator.viewer.fields[0].load(field, annotation);
      return assert.equal(jQuery(field).html(), "<i>No Comment</i>");
    });

    it("should setup the default text field to publish an event on load", function() {
      const field = document.createElement('div');
      const annotation = {text: "test"};
      const callback = sinon.spy();

      annotator.on('annotationViewerTextField', callback);
      annotator.viewer.fields[0].load(field, annotation);
      return assert(callback.calledWith(field, annotation));
    });

    it("should subscribe to custom events", function() {
      assert(mockViewer.on.calledWith('edit', annotator.onEditAnnotation));
      return assert(mockViewer.on.calledWith('delete', annotator.onDeleteAnnotation));
    });

    it("should bind to browser mouseover and mouseout events", () =>
      assert(mockViewer.element.bind.calledWith({
        'mouseover': annotator.clearViewerHideTimer,
        'mouseout':  annotator.startViewerHideTimer
      }))
    );

    return it("should append the Viewer#element to the Annotator#wrapper", () => assert(mockViewer.element.appendTo.calledWith(annotator.wrapper)));
  });

  describe("_setupEditor", function() {
    let mockEditor = null;

    beforeEach(function() {
      const element = $('<div />');

      mockEditor = {
        element
      };
      mockEditor.on = () => mockEditor;
      mockEditor.hide = () => mockEditor;
      mockEditor.addField = () => document.createElement('li');

      sinon.spy(mockEditor, 'on');
      sinon.spy(mockEditor, 'hide');
      sinon.spy(mockEditor, 'addField');
      sinon.stub(element, 'appendTo').returns(element);
      sinon.stub(Annotator, 'Editor').returns(mockEditor);

      return annotator._setupEditor();
    });

    afterEach(() => Annotator.Editor.restore());

    it("should create a new instance of Annotator.Editor and set Annotator#editor", () => assert.strictEqual(annotator.editor, mockEditor));

    it("should hide the annotator on creation", () => assert(mockEditor.hide.calledOnce));

    it("should add the default textarea field", function() {
      const options = mockEditor.addField.lastCall.args[0];

      assert(mockEditor.addField.calledOnce);
      assert.equal(options.type, 'textarea');
      assert.equal(options.label, 'Comments\u2026');
      assert.typeOf(options.load, 'function');
      return assert.typeOf(options.submit, 'function');
    });

    it("should subscribe to custom events", function() {
      assert(mockEditor.on.calledWith('hide', annotator.onEditorHide));
      return assert(mockEditor.on.calledWith('save', annotator.onEditorSubmit));
    });

    return it("should append the Editor#element to the Annotator#wrapper", () => assert(mockEditor.element.appendTo.calledWith(annotator.wrapper)));
  });

  describe("_setupDynamicStyle", function() {
    let $fix = null;

    beforeEach(function() {
      addFixture('annotator');
      return $fix = $(fix());
    });

    afterEach(() => clearFixtures());

    return it('should ensure Annotator z-indices are larger than others in the page', function() {
      $fix.show();

      const $adder = $('<div style="position:relative;" class="annotator-adder">&nbsp;</div>').appendTo($fix);
      const $filter = $('<div style="position:relative;" class="annotator-filter">&nbsp;</div>').appendTo($fix);

      const check = function(minimum) {
        const adderZ = parseInt($adder.css('z-index'), 10);
        const filterZ = parseInt($filter.css('z-index'), 10);
        assert.isTrue(adderZ > minimum);
        assert.isTrue(filterZ > minimum);
        return assert.isTrue(adderZ > filterZ);
      };

      check(1000);

      $fix.append('<div style="position: relative; z-index: 2000"></div>');
      annotator._setupDynamicStyle();
      check(2000);

      $fix.append('<div style="position: relative; z-index: 10000"></div>');
      annotator._setupDynamicStyle();
      check(10000);

      return $fix.hide();
    });
  });

  describe("getSelectedRanges", function() {
    let mockGlobal = null;
    let mockSelection = null;
    let mockRange = null;
    let mockBrowserRange = null;

    beforeEach(function() {
      mockBrowserRange = {
        cloneRange: sinon.stub()
      };
      mockBrowserRange.cloneRange.returns(mockBrowserRange);

      // This mock pretends to be both NormalizedRange and BrowserRange.
      mockRange = {
        limit: sinon.stub(),
        normalize: sinon.stub(),
        toRange: sinon.stub().returns('range')
      };
      mockRange.limit.returns(mockRange);
      mockRange.normalize.returns(mockRange);

      // https://developer.mozilla.org/en/nsISelection
      mockSelection = {
        getRangeAt: sinon.stub().returns(mockBrowserRange),
        removeAllRanges: sinon.spy(),
        addRange: sinon.spy(),
        rangeCount: 1
      };
      mockGlobal = {
        getSelection: sinon.stub().returns(mockSelection)
      };
      sinon.stub(Util, 'getGlobal').returns(mockGlobal);
      return sinon.stub(Range, 'BrowserRange').returns(mockRange);
    });

    afterEach(function() {
      Util.getGlobal.restore();
      return Range.BrowserRange.restore();
    });

    it("should retrieve the global object and call getSelection()", function() {
      annotator.getSelectedRanges();
      return assert(mockGlobal.getSelection.calledOnce);
    });

    it("should retrieve the global object and call getSelection()", function() {
      const ranges = annotator.getSelectedRanges();
      return assert.deepEqual(ranges, [mockRange]);
    });

    it("should remove any failed calls to NormalizedRange#limit(), but re-add them to the global selection", function() {
      mockRange.limit.returns(null);
      const ranges = annotator.getSelectedRanges();
      assert.deepEqual(ranges, []);
      return assert.isTrue(mockSelection.addRange.calledWith(mockBrowserRange));
    });

    it("should return an empty array if selection.isCollapsed is true", function() {
      mockSelection.isCollapsed = true;
      const ranges = annotator.getSelectedRanges();
      return assert.deepEqual(ranges, []);
    });

    it("should deselect all current ranges", function() {
      const ranges = annotator.getSelectedRanges();
      return assert(mockSelection.removeAllRanges.calledOnce);
    });

    return it("should reassign the newly normalized ranges", function() {
      const ranges = annotator.getSelectedRanges();
      assert(mockSelection.addRange.calledOnce);
      return assert.isTrue(mockSelection.addRange.calledWith('range'));
    });
  });

  describe("createAnnotation", function() {
    it("should return an empty annotation", () => assert.deepEqual(annotator.createAnnotation(), {}));

    return it("should fire the 'beforeAnnotationCreated' event providing the annotation", function() {
      sinon.spy(annotator, 'publish');
      annotator.createAnnotation();
      return assert.isTrue(annotator.publish.calledWith('beforeAnnotationCreated', [{}]));
    });
  });

  describe("setupAnnotation", function() {
    let annotation = null;
    let quote = null;
    let comment = null;
    let element = null;
    let annotationObj = null;
    let normalizedRange = null;
    let sniffedRange = null;

    beforeEach(function() {
      quote   = 'This is some annotated text';
      comment = 'This is a comment on an annotation';
      element = $('<span />');

      normalizedRange = {
        text: sinon.stub().returns(quote),
        serialize: sinon.stub().returns({})
      };
      sniffedRange = {
        normalize: sinon.stub().returns(normalizedRange)
      };
      sinon.stub(Range, 'sniff').returns(sniffedRange);
      sinon.stub(annotator, 'highlightRange').returns(element);
      sinon.spy(annotator, 'publish');

      annotationObj = {
        text: comment,
        ranges: [1]
      };
      return annotation = annotator.setupAnnotation(annotationObj);
    });

    afterEach(() => Range.sniff.restore());

    it("should return the annotation object with a comment", () => assert.equal(annotation.text, comment));

    it("should return the annotation object with the quoted text", () => assert.equal(annotation.quote, quote));

    it("should trim whitespace from start and end of quote", function() {
      normalizedRange.text.returns(`\n\t   ${quote}   \n`);
      annotation = annotator.setupAnnotation(annotationObj);
      return assert.equal(annotation.quote, quote);
    });

    it("should set the annotation.ranges", () => assert.deepEqual(annotation.ranges, [{}]));

    it("should exclude any ranges that could not be normalized", function() {
      const e = new Range.RangeError("typ", "msg");
      sniffedRange.normalize.throws(e);
      annotation = annotator.setupAnnotation({
        text: comment,
        ranges: [1]
      });

      return assert.deepEqual(annotation.ranges, []);
    });

    it("should trigger rangeNormalizeFail for each range that can't be normalized", function() {
      const e = new Range.RangeError("typ", "msg");
      sniffedRange.normalize.throws(e);
      annotator.publish = sinon.spy();
      annotation = annotator.setupAnnotation({
        text: comment,
        ranges: [1]
      });

      return assert.isTrue(annotator.publish.calledWith('rangeNormalizeFail', [annotation, 1, e]));
    });

    it("should call Annotator#highlightRange() with the normed range", () => assert.isTrue(annotator.highlightRange.calledWith(normalizedRange)));

    it("should store the annotation in the highlighted element's data store", () => assert.equal(element.data('annotation'), annotation));

    return it("should set the data-annotation-id of the highlight element to the annotation's id", () => assert.equal(element.attr('data-annotation-id'), annotation.id));
  });

  describe("updateAnnotation", function() {
    it("should publish the 'beforeAnnotationUpdated' and 'annotationUpdated' events", function() {
      const annotation = {text: "my annotation comment"};
      sinon.spy(annotator, 'publish');
      annotator.updateAnnotation(annotation);

      assert.isTrue(annotator.publish.calledWith('beforeAnnotationUpdated', [annotation]));
      return assert.isTrue(annotator.publish.calledWith('annotationUpdated', [annotation]));
    });

    return it("should set the data-annotation-id of the highlight element to the annotation's id", function() {
      const highlights = $("<span>");
      const annotation = {text: "my annotation comment", id: "deadbeef"};
      annotation.highlights = highlights;
      annotator.updateAnnotation(annotation);
      return assert.equal(highlights.attr('data-annotation-id'), annotation.id);
    });
  });

  describe("deleteAnnotation", function() {
    let annotation = null;
    let div = null;

    beforeEach(function() {
      annotation = {
        text: "my annotation comment",
        highlights: $('<span><em>Hats</em></span><span><em>Gloves</em></span>')
      };
      return div = $('<div />').append(annotation.highlights);
    });

    it("should remove the highlights from the DOM", function() {
      annotation.highlights.each(function() {
        return assert.lengthOf($(this).parent(), 1);
      });

      annotator.deleteAnnotation(annotation);
      return annotation.highlights.each(function() {
        return assert.lengthOf($(this).parent(), 0);
      });
    });

    it("should leave the content of the highlights in place", function() {
      annotator.deleteAnnotation(annotation);
      return assert.equal(div.html(), '<em>Hats</em><em>Gloves</em>');
    });

    it("should not choke when there are no highlights", () => assert.doesNotThrow((() => annotator.deleteAnnotation({})), Error));

    return it("should publish the 'annotationDeleted' event", function() {
      sinon.spy(annotator, 'publish');
      annotator.deleteAnnotation(annotation);
      return assert.isTrue(annotator.publish.calledWith('annotationDeleted', [annotation]));
    });
  });

  describe("loadAnnotations", function() {
    beforeEach(function() {
      sinon.stub(annotator, 'setupAnnotation');
      return sinon.spy(annotator, 'publish');
    });

    it("should call Annotator#setupAnnotation for each annotation in the Array", function() {
      const annotations = [{}, {}, {}, {}];
      annotator.loadAnnotations(annotations);
      return assert.equal(annotator.setupAnnotation.callCount, 4);
    });

    it("should publish the annotationsLoaded event with all loaded annotations", function() {
      const annotations = [{}, {}, {}, {}];
      annotator.loadAnnotations(annotations.slice());
      return assert.isTrue(annotator.publish.calledWith('annotationsLoaded', [annotations]));
    });

    return it("should break the annotations into blocks of 10", function() {
      const clock = sinon.useFakeTimers();
      const annotations = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];

      annotator.loadAnnotations(annotations);
      assert.equal(annotator.setupAnnotation.callCount, 10);

      while (annotations.length > 0) {
        clock.tick(10);
      }

      assert.equal(annotator.setupAnnotation.callCount, 13);
      return clock.restore();
    });
  });

  describe("dumpAnnotations", function() {
    it("returns false and prints a warning if no Store plugin is active", function() {
      sinon.stub(console, 'warn');
      assert.isFalse(annotator.dumpAnnotations());
      return assert(console.warn.calledOnce);
    });

    return it("returns the results of the Store plugins dumpAnnotations method", function() {
      annotator.plugins.Store = { dumpAnnotations() { return [1,2,3]; } };
      return assert.deepEqual(annotator.dumpAnnotations(), [1,2,3]);
    });
  });

  describe("highlightRange", function() {
    it("should return a highlight element for every textNode in the range", function() {
      const textNodes = (['hello', 'world'].map((text) => document.createTextNode(text)));
      const mockRange =
        {textNodes() { return textNodes; }};

      const elements = annotator.highlightRange(mockRange);
      assert.lengthOf(elements, 2);
      assert.equal(elements[0].className, 'annotator-hl');
      assert.equal(elements[0].firstChild, textNodes[0]);
      return assert.equal(elements[1].firstChild, textNodes[1]);
    });

    it("should ignore textNodes that contain only whitespace", function() {
      const textNodes = (['hello', '\n ', '      '].map((text) => document.createTextNode(text)));
      const mockRange =
        {textNodes() { return textNodes; }};

      const elements = annotator.highlightRange(mockRange);
      assert.lengthOf(elements, 1);
      assert.equal(elements[0].className, 'annotator-hl');
      return assert.equal(elements[0].firstChild, textNodes[0]);
    });

    return it("should set highlight element class names to its second argument", function() {
      const textNodes = (['hello', 'world'].map((text) => document.createTextNode(text)));
      const mockRange =
        {textNodes() { return textNodes; }};

      const elements = annotator.highlightRange(mockRange, 'monkeys');
      return assert.equal(elements[0].className, 'monkeys');
    });
  });

  describe("highlightRanges", function() {
    it("should return a list of highlight elements all highlighted ranges", function() {
      const textNodes = (['hello', 'world'].map((text) => document.createTextNode(text)));
      const mockRange =
        {textNodes() { return textNodes; }};
      const ranges = [mockRange, mockRange, mockRange];
      const elements = annotator.highlightRanges(ranges);
      assert.lengthOf(elements, 6);
      return assert.equal(elements[0].className, 'annotator-hl');
    });

    return it("should set highlight element class names to its second argument", function() {
      const textNodes = (['hello', 'world'].map((text) => document.createTextNode(text)));
      const mockRange =
        {textNodes() { return textNodes; }};
      const ranges = [mockRange, mockRange, mockRange];
      const elements = annotator.highlightRanges(ranges, 'monkeys');
      return assert.equal(elements[0].className, 'monkeys');
    });
  });

  describe("addPlugin", function() {
    let plugin = null;

    beforeEach(function() {
      plugin = {
        pluginInit: sinon.spy()
      };
      return Annotator.Plugin.Foo = sinon.stub().returns(plugin);
    });

    it("should add and instantiate a plugin of the specified name", function() {
      annotator.addPlugin('Foo');
      return assert.isTrue(Annotator.Plugin.Foo.calledWith(annotator.element[0], undefined));
    });

    it("should pass on the provided options", function() {
      const options = {foo: 'bar'};
      annotator.addPlugin('Foo', options);
      return assert.isTrue(Annotator.Plugin.Foo.calledWith(annotator.element[0], options));
    });

    it("should attach the Annotator instance", function() {
      annotator.addPlugin('Foo');
      return assert.equal(plugin.annotator, annotator);
    });

    it("should call Plugin#pluginInit()", function() {
      annotator.addPlugin('Foo');
      return assert(plugin.pluginInit.calledOnce);
    });

    it("should complain if you try and instantiate a plugin twice", function() {
      sinon.stub(console, 'error');
      annotator.addPlugin('Foo');
      annotator.addPlugin('Foo');
      assert.equal(Annotator.Plugin.Foo.callCount, 1);
      assert(console.error.calledOnce);
      return console.error.restore();
    });

    return it("should complain if you try and instantiate a plugin that doesn't exist", function() {
      sinon.stub(console, 'error');
      annotator.addPlugin('Bar');
      assert.isFalse(annotator.plugins['Bar'] != null);
      assert(console.error.calledOnce);
      return console.error.restore();
    });
  });

  describe("showEditor", function() {
    beforeEach(function() {
      sinon.spy(annotator, 'publish');
      sinon.spy(annotator, 'deleteAnnotation');
      sinon.spy(annotator.editor, 'load');
      return sinon.spy(annotator.editor.element, 'css');
    });

    it("should call Editor#load() on the Annotator#editor", function() {
      const annotation = {text: 'my annotation comment'};
      annotator.showEditor(annotation, {});
      return assert.isTrue(annotator.editor.load.calledWith(annotation));
    });

    it("should set the top/left properties of the Editor#element", function() {
      const location = {top: 20, left: 20};
      annotator.showEditor({}, location);
      return assert.isTrue(annotator.editor.element.css.calledWith(location));
    });

    return it("should publish the 'annotationEditorShown' event passing the editor and annotations", function() {
      const annotation = {text: 'my annotation comment'};
      annotator.showEditor(annotation, {});
      return assert(annotator.publish.calledWith('annotationEditorShown', [annotator.editor, annotation]));
    });
  });

  describe("onEditorHide", function() {
    it("should publish the 'annotationEditorHidden' event and provide the Editor and annotation", function() {
      sinon.spy(annotator, 'publish');
      annotator.onEditorHide();
      return assert(annotator.publish.calledWith('annotationEditorHidden', [annotator.editor]));
    });

    return it("should set the Annotator#ignoreMouseup property to false", function() {
      annotator.ignoreMouseup = true;
      annotator.onEditorHide();
      return assert.isFalse(annotator.ignoreMouseup);
    });
  });

  describe("onEditorSubmit", function() {
    let annotation = null;

    beforeEach(function() {
      annotation = {"text": "bah"};
      sinon.spy(annotator, 'publish');
      sinon.spy(annotator, 'setupAnnotation');
      return sinon.spy(annotator, 'updateAnnotation');
    });

    return it("should publish the 'annotationEditorSubmit' event and pass the Editor and annotation", function() {
      annotator.onEditorSubmit(annotation);
      return assert(annotator.publish.calledWith('annotationEditorSubmit', [annotator.editor, annotation]));
    });
  });

  describe("showViewer", function() {
    beforeEach(function() {
      sinon.spy(annotator, 'publish');
      sinon.spy(annotator.viewer, 'load');
      return sinon.spy(annotator.viewer.element, 'css');
    });

    it("should call Viewer#load() on the Annotator#viewer", function() {
      const annotations = [{text: 'my annotation comment'}];
      annotator.showViewer(annotations, {});
      return assert.isTrue(annotator.viewer.load.calledWith(annotations));
    });

    it("should set the top/left properties of the Editor#element", function() {
      const location = {top: 20, left: 20};
      annotator.showViewer([], location);
      return assert.isTrue(annotator.viewer.element.css.calledWith(location));
    });

    return it("should publish the 'annotationViewerShown' event passing the viewer and annotations", function() {
      const annotations = [{text: 'my annotation comment'}];
      annotator.showViewer(annotations, {});
      return assert(annotator.publish.calledWith('annotationViewerShown', [annotator.viewer, annotations]));
    });
  });

  describe("startViewerHideTimer", function() {
    beforeEach(() => sinon.spy(annotator.viewer, 'hide'));

    it("should call Viewer.hide() on the Annotator#viewer after 250ms", function() {
      const clock = sinon.useFakeTimers();
      annotator.startViewerHideTimer();
      clock.tick(250);
      assert(annotator.viewer.hide.calledOnce);
      return clock.restore();
    });

    return it("should NOT call Viewer.hide() on the Annotator#viewer if @viewerHideTimer is set", function() {
      const clock = sinon.useFakeTimers();
      annotator.viewerHideTimer = 60;
      annotator.startViewerHideTimer();
      clock.tick(250);
      assert.isFalse(annotator.viewer.hide.calledOnce);
      return clock.restore();
    });
  });

  describe("clearViewerHideTimer", () =>
    it("should clear the @viewerHideTimer property", function() {
      annotator.viewerHideTimer = 456;
      annotator.clearViewerHideTimer();
      return assert.isFalse(annotator.viewerHideTimer);
    })
  );

  describe("checkForStartSelection", function() {
    beforeEach(function() {
      sinon.spy(annotator, 'startViewerHideTimer');
      annotator.mouseIsDown = false;
      return annotator.checkForStartSelection();
    });

    it("should call Annotator#startViewerHideTimer()", () => assert(annotator.startViewerHideTimer.calledOnce));

    it("should NOT call #startViewerHideTimer() if mouse is over the annotator", function() {
      annotator.startViewerHideTimer.reset();
      annotator.checkForStartSelection({target: annotator.viewer.element});
      return assert.isFalse(annotator.startViewerHideTimer.called);
    });

    return it("should set @mouseIsDown to true", () => assert.isTrue(annotator.mouseIsDown));
  });

  describe("checkForEndSelection", function() {
    let mockEvent = null;
    let mockOffset = null;
    let mockRanges = null;

    beforeEach(function() {
      mockEvent = { target: document.createElement('span') };
      mockOffset = {top: 0, left: 0};
      mockRanges = [{}];

      sinon.stub(Util, 'mousePosition').returns(mockOffset);
      sinon.stub(annotator.adder, 'show').returns(annotator.adder);
      sinon.stub(annotator.adder, 'hide').returns(annotator.adder);
      sinon.stub(annotator.adder, 'css').returns(annotator.adder);
      sinon.stub(annotator, 'getSelectedRanges').returns(mockRanges);

      annotator.mouseIsDown    = true;
      annotator.selectedRanges = [];
      return annotator.checkForEndSelection(mockEvent);
    });

    afterEach(() => Util.mousePosition.restore());

    it("should get the current selection from Annotator#getSelectedRanges()", () => assert(annotator.getSelectedRanges.calledOnce));

    it("should set @mouseIsDown to false", () => assert.isFalse(annotator.mouseIsDown));

    it("should set the Annotator#selectedRanges property", () => assert.equal(annotator.selectedRanges, mockRanges));

    it("should display the Annotator#adder if valid selection", function() {
      assert(annotator.adder.show.calledOnce);
      assert.isTrue(annotator.adder.css.calledWith(mockOffset));
      return assert.isTrue(Util.mousePosition.calledWith(mockEvent, annotator.wrapper[0]));
    });

    it("should hide the Annotator#adder if NOT valid selection", function() {
      annotator.adder.hide.reset();
      annotator.adder.show.reset();
      annotator.getSelectedRanges.returns([]);

      annotator.checkForEndSelection(mockEvent);
      assert(annotator.adder.hide.calledOnce);
      return assert.isFalse(annotator.adder.show.called);
    });

    it("should hide the Annotator#adder if target is part of the annotator", function() {
      annotator.adder.hide.reset();
      annotator.adder.show.reset();

      const mockNode = document.createElement('span');
      mockEvent.target = annotator.viewer.element[0];

      sinon.stub(annotator, 'isAnnotator').returns(true);
      annotator.getSelectedRanges.returns([{commonAncestor: mockNode}]);

      annotator.checkForEndSelection(mockEvent);
      assert.isTrue(annotator.isAnnotator.calledWith(mockNode));

      assert.isFalse(annotator.adder.hide.called);
      return assert.isFalse(annotator.adder.show.called);
    });

    return it("should return if @ignoreMouseup is true", function() {
      annotator.getSelectedRanges.reset();
      annotator.ignoreMouseup = true;
      annotator.checkForEndSelection(mockEvent);
      return assert.isFalse(annotator.getSelectedRanges.called);
    });
  });

  describe("isAnnotator", function() {
    it("should return true if the element is part of the annotator", function() {
      const elements = [
        annotator.viewer.element,
        annotator.adder,
        annotator.editor.element.find('ul')
      ];

      return (() => {
        const result = [];
        for (let element of Array.from(elements)) {
          result.push(assert.isTrue(annotator.isAnnotator(element)));
        }
        return result;
      })();
    });

    it("should return false if the element is NOT part of the annotator", function() {
      const elements = [
        null,
        annotator.element.parent(),
        document.createElement('span'),
        annotator.wrapper
      ];
      return (() => {
        const result = [];
        for (let element of Array.from(elements)) {
          result.push(assert.isFalse(annotator.isAnnotator(element)));
        }
        return result;
      })();
    });

    it("should ignore the default annotator highlight elements", function() {
      const element = $('<span class="annotator-hl"></span>')[0];
      return assert.isFalse(annotator.isAnnotator(element));
    });

    return it("should ignore the special annotator highlight elements", function() {
      const element = $('<span class="annotator-hl-filtered"></span>')[0];
      return assert.isFalse(annotator.isAnnotator(element));
    });
  });

  describe("onHighlightMouseover", function() {
    let element = null;
    let mockEvent = null;
    let mockOffset = null;
    let annotation = null;

    beforeEach(function() {
      annotation = {text: "my comment"};
      element = $('<span />').data('annotation', annotation);
      mockEvent = {
        target: element[0]
      };
      mockOffset = {top: 0, left: 0};

      sinon.stub(Util, 'mousePosition').returns(mockOffset);
      sinon.spy(annotator, 'showViewer');

      annotator.viewerHideTimer = 60;
      return annotator.onHighlightMouseover(mockEvent);
    });

    afterEach(() => Util.mousePosition.restore());

    it("should clear the current @viewerHideTimer", () => assert.isFalse(annotator.viewerHideTimer));

    it("should fetch the current mouse position", () => assert.isTrue(Util.mousePosition.calledWith(mockEvent, annotator.wrapper[0])));

    return it("should display the Annotation#viewer with annotations", () => assert.isTrue(annotator.showViewer.calledWith([annotation], mockOffset)));
  });

  describe("onAdderMousedown", () =>
    it("should set the @ignoreMouseup property to true", function() {
      annotator.ignoreMouseup = false;
      annotator.onAdderMousedown();
      return assert.isTrue(annotator.ignoreMouseup);
    })
  );

  describe("onAdderClick", function() {
    let annotation = null;
    let mockOffset = null;
    let mockSubscriber = null;
    let quote = null;
    let element = null;
    let normalizedRange = null;
    let sniffedRange = null;

    beforeEach(function() {
      annotation =
        {text: "test"};
      quote = 'This is some annotated text';
      element = $('<span />').addClass('annotator-hl');

      mockOffset = {top: 0, left:0};

      mockSubscriber = sinon.spy();
      annotator.subscribe('annotationCreated', mockSubscriber);

      normalizedRange = {
        text: sinon.stub().returns(quote),
        serialize: sinon.stub().returns({})
      };
      sniffedRange = {
        normalize: sinon.stub().returns(normalizedRange)
      };

      sinon.stub(annotator.adder, 'hide');
      sinon.stub(annotator.adder, 'position').returns(mockOffset);
      sinon.stub(annotator, 'createAnnotation').returns(annotation);
      sinon.spy(annotator, 'setupAnnotation');
      sinon.stub(annotator, 'deleteAnnotation');
      sinon.stub(annotator, 'showEditor');
      sinon.stub(Range, 'sniff').returns(sniffedRange);
      sinon.stub(annotator, 'highlightRange').returns(element);
      sinon.spy(element, 'addClass');
      annotator.selectedRanges = ['foo'];
      return annotator.onAdderClick();
    });

    afterEach(() => Range.sniff.restore());

    it("should hide the Annotation#adder", () => assert(annotator.adder.hide.calledOnce));

    it("should create a new annotation", () => assert(annotator.createAnnotation.calledOnce));

    it("should set up the annotation", () => assert.isTrue(annotator.setupAnnotation.calledWith(annotation)));

    it("should display the Annotation#editor in the same place as the Annotation#adder", function() {
      assert(annotator.adder.position.calledOnce);
      return assert.isTrue(annotator.showEditor.calledWith(annotation, mockOffset));
    });

    it("should add temporary highlights to the document to show the user what they selected", function() {
      assert.isTrue(annotator.highlightRange.calledWith(normalizedRange));
      return assert.equal(element[0].className, 'annotator-hl annotator-hl-temporary');
    });

    it("should persist the temporary highlights if the annotation is saved", function() {
      annotator.publish('annotationEditorSubmit');
      return assert.equal(element[0].className, 'annotator-hl');
    });

    it("should trigger the 'annotationCreated' event if the edit is saved", function() {
      annotator.onEditorSubmit(annotation);
      return assert.isTrue(mockSubscriber.calledWith(annotation));
    });

    return it("should call Annotator#deleteAnnotation if editing is cancelled", function() {
      (annotator.onEditorHide)();
      (annotator.onEditorSubmit)();
      assert.isFalse(mockSubscriber.calledWith('annotationCreated'));
      return assert.isTrue(annotator.deleteAnnotation.calledWith(annotation));
    });
  });

  describe("onEditAnnotation", function() {
    let annotation = null;
    let mockOffset = null;
    let mockSubscriber = null;

    beforeEach(function() {
      annotation = {text: "my mock annotation"};
      mockOffset = {top: 0, left: 0};
      mockSubscriber = sinon.spy();
      sinon.spy(annotator, "showEditor");
      sinon.spy(annotator.viewer, "hide");
      sinon.stub(annotator.viewer.element, "position").returns(mockOffset);
      sinon.spy(annotator, "updateAnnotation");
      return annotator.onEditAnnotation(annotation);
    });

    it("should display the Annotator#editor in the same positions as Annotatorviewer", function() {
      assert(annotator.viewer.hide.calledOnce);
      return assert.isTrue(annotator.showEditor.calledWith(annotation, mockOffset));
    });

    it("should call 'updateAnnotation' event if the edit is saved", function() {
      annotator.onEditorSubmit(annotation);
      return assert.isTrue(annotator.updateAnnotation.calledWith(annotation));
    });

    return it("should not call 'updateAnnotation' if editing is cancelled", function() {
      (annotator.onEditorHide)();
      annotator.onEditorSubmit(annotation);
      return assert.isFalse(annotator.updateAnnotation.calledWith(annotation));
    });
  });

  return describe("onDeleteAnnotation", () =>
    it("should pass the annotation on to Annotator#deleteAnnotation()", function() {
      const annotation = {text: "my mock annotation"};
      sinon.spy(annotator, "deleteAnnotation");
      sinon.spy(annotator.viewer, "hide");

      annotator.onDeleteAnnotation(annotation);

      assert(annotator.viewer.hide.calledOnce);
      return assert.isTrue(annotator.deleteAnnotation.calledWith(annotation));
    })
  );
});

describe("Annotator.noConflict()", function() {
  let _Annotator = null;

  beforeEach(() => _Annotator = Annotator);

  afterEach(() => window.Annotator = _Annotator);

  it("should restore the value previously occupied by window.Annotator", function() {
    Annotator.noConflict();
    return assert.isUndefined(window.Annotator);
  });

  return it("should return the Annotator object", function() {
    const result = Annotator.noConflict();
    return assert.equal(result, _Annotator);
  });
});

describe("Annotator.supported()", function() {

  beforeEach(() => window._Selection = window.getSelection);

  afterEach(() => window.getSelection = window._Selection);

  it("should return true if the browser has window.getSelection method", function() {
    window.getSelection = function() {};
    return assert.isTrue(Annotator.supported());
  });

  return xit("should return false if the browser has no window.getSelection method", function() {
    // The method currently checks for getSelection on load and will always
    // return that result.
    window.getSelection = undefined;
    return assert.isFalse(Annotator.supported());
  });
});
