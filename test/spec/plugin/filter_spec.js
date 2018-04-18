/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("Filter", function() {
  let plugin  = null;
  let element = null;

  beforeEach(function() {
    element = $('<div />');
    const annotator = {
      subscribe: sinon.spy(),
      element: {
        find: sinon.stub().returns($())
      }
    };
    plugin = new Annotator.Plugin.Filter(element[0]);
    return plugin.annotator = annotator;
  });

  afterEach(() => plugin.element.remove());

  describe("events", function() {
    let filterElement = null;

    beforeEach(function() {
      filterElement = $(plugin.html.filter);
      return plugin.element.append(filterElement);
    });

    afterEach(() => filterElement.remove());

    it("should call Filter#_onFilterFocus when a filter input is focussed", function() {
      sinon.spy(plugin, '_onFilterFocus');
      filterElement.find('input').focus();
      return assert(plugin._onFilterFocus.calledOnce);
    });

    it("should call Filter#_onFilterBlur when a filter input is blurred", function() {
      sinon.spy(plugin, '_onFilterBlur');
      filterElement.find('input').blur();
      return assert(plugin._onFilterBlur.calledOnce);
    });

    return it("should call Filter#_onFilterKeyup when a key is pressed in an input", function() {
      sinon.spy(plugin, '_onFilterKeyup');
      filterElement.find('input').keyup();
      return assert(plugin._onFilterKeyup.calledOnce);
    });
  });

  describe("constructor", function() {
    it("should have an empty filters array", () => assert.deepEqual(plugin.filters, []));

    it("should have an filter element wrapped in jQuery", function() {
      assert.isTrue(plugin.filter instanceof jQuery);
      return assert.lengthOf(plugin.filter, 1);
    });

    return it("should append the toolbar to the @options.appendTo selector", function() {
      assert.isTrue(plugin.element instanceof jQuery);
      assert.lengthOf(plugin.element, 1);

      const parent = $(plugin.options.appendTo);
      return assert.equal(plugin.element.parent()[0], parent[0]);
    });
  });

  describe("pluginInit", function() {
    beforeEach(function() {
      sinon.stub(plugin, 'updateHighlights');
      sinon.stub(plugin, '_setupListeners').returns(plugin);
      sinon.stub(plugin, '_insertSpacer').returns(plugin);
      return sinon.stub(plugin, 'addFilter');
    });

    it("should call Filter#updateHighlights()", function() {
      plugin.pluginInit();
      return assert(plugin.updateHighlights.calledOnce);
    });

    it("should call Filter#_setupListeners()", function() {
      plugin.pluginInit();
      return assert(plugin._setupListeners.calledOnce);
    });

    it("should call Filter#_insertSpacer()", function() {
      plugin.pluginInit();
      return assert(plugin._insertSpacer.calledOnce);
    });

    return it("should load any filters in the Filter#options.filters array", function() {
      const filters = [
        {label: 'filter1'},
        {label: 'filter2'},
        {label: 'filter3'}
      ];

      plugin.options.filters = filters;
      plugin.pluginInit();

      return Array.from(filters).map((filter) =>
        assert.isTrue(plugin.addFilter.calledWith(filter)));
    });
  });

  describe("_setupListeners", () =>
    it("should subscribe to all relevant events on the annotator", function() {
      plugin._setupListeners();
      const events = [
        'annotationsLoaded', 'annotationCreated',
        'annotationUpdated', 'annotationDeleted'
      ];
      return Array.from(events).map((event) =>
        assert.isTrue(plugin.annotator.subscribe.calledWith(event, plugin.updateHighlights)));
    })
  );

  describe("addFilter", function() {
    let filter = null;

    beforeEach(function() {
      filter = { label: 'Tag', property: 'tags' };
      return plugin.addFilter(filter);
    });

    it("should add a filter object to Filter#plugins", () => assert.ok(plugin.filters[0]));

    it("should append the html to Filter#toolbar", function() {
      filter = plugin.filters[0];
      return assert.equal(filter.element[0], plugin.element.find('#annotator-filter-tags').parent()[0]);
    });

    it("should store the filter in the elements data store under 'filter'", function() {
      filter = plugin.filters[0];
      return assert.equal(filter.element.data('filter'), filter);
    });

    return it("should not add a filter for a property that has already been loaded", function() {
      plugin.addFilter({ label: 'Tag', property: 'tags' });
      return assert.lengthOf(plugin.filters, 1);
    });
  });

  describe("updateFilter", function() {
    let filter = null;
    let annotations = null;

    beforeEach(function() {
      filter = {
        id: 'text',
        label: 'Annotation',
        property: 'text',
        element: $('<span><input value="ca" /></span>'),
        annotations: [],
        isFiltered(value, text) {
          return text.indexOf('ca') !== -1;
        }
      };
      annotations = [
        {text: 'cat'},
        {text: 'dog'},
        {text: 'car'}
      ];

      plugin.filters = {'text': filter};
      plugin.highlights = {
        map() { return annotations; }
      };

      sinon.stub(plugin, 'updateHighlights');
      sinon.stub(plugin, 'resetHighlights');
      return sinon.stub(plugin, 'filterHighlights');
    });

    it("should call Filter#updateHighlights()", function() {
      plugin.updateFilter(filter);
      return assert(plugin.updateHighlights.calledOnce);
    });

    it("should call Filter#resetHighlights()", function() {
      plugin.updateFilter(filter);
      return assert(plugin.resetHighlights.calledOnce);
    });

    it("should filter the cat and car annotations", function() {
      plugin.updateFilter(filter);
      return assert.deepEqual(filter.annotations, [
        annotations[0], annotations[2]
      ]);
    });

    it("should call Filter#filterHighlights()", function() {
      plugin.updateFilter(filter);
      return assert(plugin.filterHighlights.calledOnce);
    });

    return it("should NOT call Filter#filterHighlights() if there is no input", function() {
      filter.element.find('input').val('');
      plugin.updateFilter(filter);
      return assert.isFalse(plugin.filterHighlights.called);
    });
  });

  describe("updateHighlights", function() {
    beforeEach(function() {
      plugin.highlights = null;
      return plugin.updateHighlights();
    });

    it("should fetch the visible highlights from the Annotator#element", () => assert.isTrue(plugin.annotator.element.find.calledWith('.annotator-hl:visible')));

    return it("should set the Filter#highlights property", () => assert.ok(plugin.highlights));
  });

  describe("filterHighlights", function() {
    let div = null;

    beforeEach(function() {
      plugin.highlights = $('<span /><span /><span /><span /><span />');

      // This annotation appears in both filters.
      const match = {highlights: [plugin.highlights[1]]};
      plugin.filters = [
        {
          annotations: [
            {highlights: [plugin.highlights[0]]},
            match
          ]
        },
        {
          annotations: [
            {highlights: [plugin.highlights[4]]},
            match,
            {highlights: [plugin.highlights[2]]}
          ]
        }
      ];
      return div = $('<div>').append(plugin.highlights);
    });

    it("should hide all highlights not whitelisted by _every_ filter", function() {
      plugin.filterHighlights();

      //Only index 1 should remain.
      return assert.lengthOf(div.find(`.${plugin.classes.hl.hide}`), 4);
    });

    it("should hide all highlights not whitelisted by _every_ filter if every filter is active", function() {
      plugin.filters[1].annotations = [];
      plugin.filterHighlights();

      return assert.lengthOf(div.find(`.${plugin.classes.hl.hide}`), 3);
    });

    return it("should hide all highlights not whitelisted if only one filter", function() {
      plugin.filters = plugin.filters.slice(0, 1);
      plugin.filterHighlights();

      return assert.lengthOf(div.find(`.${plugin.classes.hl.hide}`), 3);
    });
  });

  describe("resetHighlights", () =>
    it("should remove the filter-hide class from all highlights", function() {
      plugin.highlights = $('<span /><span /><span />').addClass(plugin.classes.hl.hide);
      plugin.resetHighlights();
      return assert.lengthOf(plugin.highlights.filter(`.${plugin.classes.hl.hide}`), 0);
    })
  );

  return describe("group: filter input actions", function() {
    let filterElement = null;

    beforeEach(function() {
      filterElement = $(plugin.html.filter);
      return plugin.element.append(filterElement);
    });

    describe("_onFilterFocus", () =>
      it("should add an active class to the element", function() {
        plugin._onFilterFocus({
          target: filterElement.find('input')[0]
        });
        return assert.isTrue(filterElement.hasClass(plugin.classes.active));
      })
    );

    describe("_onFilterBlur", function() {
      it("should remove the active class from the element", function() {
        filterElement.addClass(plugin.classes.active);
        plugin._onFilterBlur({
          target: filterElement.find('input')[0]
        });
        return assert.isFalse(filterElement.hasClass(plugin.classes.active));
      });

      return it("should NOT remove the active class from the element if it has a value", function() {
        filterElement.addClass(plugin.classes.active);
        plugin._onFilterBlur({
          target: filterElement.find('input').val('filtered')[0]
        });
        return assert.isTrue(filterElement.hasClass(plugin.classes.active));
      });
    });

    describe("_onFilterKeyup", function() {
      beforeEach(function() {
        plugin.filters = [{label: 'My Filter'}];
        return sinon.stub(plugin, 'updateFilter');
      });

      it("should call Filter#updateFilter() with the relevant filter", function() {
        filterElement.data('filter', plugin.filters[0]);
        plugin._onFilterKeyup({
          target: filterElement.find('input')[0]
        });
        return assert.isTrue(plugin.updateFilter.calledWith(plugin.filters[0]));
      });

      return it("should NOT call Filter#updateFilter() if no filter is found", function() {
        plugin._onFilterKeyup({
          target: filterElement.find('input')[0]
        });
        return assert.isFalse(plugin.updateFilter.called);
      });
    });

    describe("navigation", function() {
      let element1    = null;
      let element2    = null;
      let element3    = null;
      let annotation1 = null;
      let annotation2 = null;
      let annotation3 = null;

      beforeEach(function() {
        element1    = $('<span />');
        annotation1 = {text: 'annotation1', highlights: [element1[0]]};
        element1.data('annotation', annotation1);

        element2    = $('<span />');
        annotation2 = {text: 'annotation2', highlights: [element2[0]]};
        element2.data('annotation', annotation2);

        element3    = $('<span />');
        annotation3 = {text: 'annotation3', highlights: [element3[0]]};
        element3.data('annotation', annotation3);

        plugin.highlights = $([element1[0],element2[0],element3[0]]);
        return sinon.spy(plugin, '_scrollToHighlight');
      });

      describe("_onNextClick", function() {
        it("should advance to the next element", function() {
          element2.addClass(plugin.classes.hl.active);
          plugin._onNextClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
        });

        it("should loop back to the start once it gets to the end", function() {
          element3.addClass(plugin.classes.hl.active);
          plugin._onNextClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
        });

        it("should use the first element if there is no current element", function() {
          plugin._onNextClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
        });

        it("should only navigate through non hidden elements", function() {
          element1.addClass(plugin.classes.hl.active);
          element2.addClass(plugin.classes.hl.hide);
          plugin._onNextClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
        });

        return it("should do nothing if there are no annotations", function() {
          plugin.highlights = $();
          plugin._onNextClick();
          return assert.isFalse(plugin._scrollToHighlight.called);
        });
      });

      return describe("_onPreviousClick", function() {
        it("should advance to the previous element", function() {
          element3.addClass(plugin.classes.hl.active);
          plugin._onPreviousClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element2[0]]));
        });

        it("should loop to the end once it gets to the beginning", function() {
          element1.addClass(plugin.classes.hl.active);
          plugin._onPreviousClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
        });

        it("should use the last element if there is no current element", function() {
          plugin._onPreviousClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
        });

        it("should only navigate through non hidden elements", function() {
          element3.addClass(plugin.classes.hl.active);
          element2.addClass(plugin.classes.hl.hide);
          plugin._onPreviousClick();
          return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
        });

        return it("should do nothing if there are no annotations", function() {
          plugin.highlights = $();
          plugin._onPreviousClick();
          return assert.isFalse(plugin._scrollToHighlight.called);
        });
      });
    });

    describe("_scrollToHighlight", function() {
      let mockjQuery = null;

      beforeEach(function() {
        plugin.highlights = $();
        mockjQuery = {
          addClass: sinon.spy(),
          animate: sinon.spy(),
          offset: sinon.stub().returns({top: 0})
        };
        sinon.spy(plugin.highlights, 'removeClass');
        return sinon.stub(jQuery.prototype, 'init').returns(mockjQuery);
      });

      afterEach(() => jQuery.prototype.init.restore());

      it("should remove active class from currently active element", function() {
        plugin._scrollToHighlight({});
        return assert.isTrue(plugin.highlights.removeClass.calledWith(plugin.classes.hl.active));
      });

      it("should add active class to provided elements", function() {
        plugin._scrollToHighlight({});
        return assert.isTrue(mockjQuery.addClass.calledWith(plugin.classes.hl.active));
      });

      return it("should animate the scrollbar to the highlight offset", function() {
        plugin._scrollToHighlight({});
        assert(mockjQuery.offset.calledOnce);
        return assert(mockjQuery.animate.calledOnce);
      });
    });

    return describe("_onClearClick", function() {
      let mockjQuery = null;

      beforeEach(function() {
        mockjQuery = {};
        mockjQuery.val = sinon.stub().returns(mockjQuery);
        mockjQuery.prev = sinon.stub().returns(mockjQuery);
        mockjQuery.keyup = sinon.stub().returns(mockjQuery);
        mockjQuery.blur = sinon.stub().returns(mockjQuery);

        sinon.stub(jQuery.prototype, 'init').returns(mockjQuery);
        return plugin._onClearClick({target: {}});
      });

      afterEach(() => jQuery.prototype.init.restore());

      it("should clear the input", () => assert.isTrue(mockjQuery.val.calledWith('')));

      it("should trigger the blur event", () => assert(mockjQuery.blur.calledOnce));

      return it("should trigger the keyup event", () => assert(mockjQuery.keyup.calledOnce));
    });
  });
});
