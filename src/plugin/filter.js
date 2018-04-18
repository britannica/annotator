/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Cls = (Annotator.Plugin.Filter = class Filter extends Annotator.Plugin {
  static initClass() {
    // Events and callbacks to bind to the Filter#element.
    this.prototype.events = {
      ".annotator-filter-property input focus": "_onFilterFocus",
      ".annotator-filter-property input blur":  "_onFilterBlur",
      ".annotator-filter-property input keyup": "_onFilterKeyup",
      ".annotator-filter-previous click":       "_onPreviousClick",
      ".annotator-filter-next click":           "_onNextClick",
      ".annotator-filter-clear click":          "_onClearClick"
    };
  
    // Common classes used to change plugin state.
    this.prototype.classes = {
      active:   'annotator-filter-active',
      hl: {
        hide:   'annotator-hl-filtered',
        active: 'annotator-hl-active'
      }
    };
  
    // HTML templates for the plugin UI.
    this.prototype.html = {
      element: `\
<div class="annotator-filter">
  <strong>` + Annotator._t('Navigate:') + `</strong>
<span class="annotator-filter-navigation">
  <button class="annotator-filter-previous">` + Annotator._t('Previous') + `</button>
<button class="annotator-filter-next">` + Annotator._t('Next') + `</button>
</span>
<strong>` + Annotator._t('Filter by:') + `</strong>
</div>\
`,
      filter:  `\
<span class="annotator-filter-property">
  <label></label>
  <input/>
  <button class="annotator-filter-clear">` + Annotator._t('Clear') + `</button>
</span>\
`
    };
  
    // Default options for the plugin.
    this.prototype.options = {
      // A CSS selector or Element to append the plugin toolbar to.
      appendTo: 'body',
  
      // An array of filters can be provided on initialisation.
      filters: [],
  
      // Adds a default filter on annotations.
      addAnnotationFilter: true,
  
      // Public: Determines if the property is contained within the provided
      // annotation property. Default is to split the string on spaces and only
      // return true if all keywords are contained in the string. This method
      // can be overridden by the user when initialising the plugin.
      //
      // string   - An input String from the fitler.
      // property - The annotation propery to query.
      //
      // Examples
      //
      //   plugin.option.getKeywords('hello', 'hello world how are you?')
      //   # => Returns true
      //
      //   plugin.option.getKeywords('hello bill', 'hello world how are you?')
      //   # => Returns false
      //
      // Returns an Array of keyword Strings.
      isFiltered(input, property) {
        if (!input || !property) { return false; }
  
        for (let keyword of Array.from((input.split(/\s+/)))) {
          if (property.indexOf(keyword) === -1) { return false; }
        }
  
        return true;
      }
    };
  }

  // Public: Creates a new instance of the Filter plugin.
  //
  // element - The Annotator element (this is ignored by the plugin).
  // options - An Object literal of options.
  //
  // Examples
  //
  //   filter = new Annotator.Plugin.Filter(annotator.element)
  //
  // Returns a new instance of the Filter plugin.
  constructor(element, options) {
    // As most events for this plugin are relative to the toolbar which is
    // not inside the Annotator#Element we override the element property.
    // Annotator#Element can still be accessed via @annotator.element.
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.updateHighlights = this.updateHighlights.bind(this);
    this._onFilterFocus = this._onFilterFocus.bind(this);
    this._onFilterBlur = this._onFilterBlur.bind(this);
    this._onFilterKeyup = this._onFilterKeyup.bind(this);
    this._onNextClick = this._onNextClick.bind(this);
    this._onPreviousClick = this._onPreviousClick.bind(this);
    element = $(this.html.element).appendTo((options != null ? options.appendTo : undefined) || this.options.appendTo);

    super(element, options);

    if (!this.options.filters) { this.options.filters = []; }

    this.filter  = $(this.html.filter);
    this.filters = [];
    this.current  = 0;
  }

  // Public: Adds new filters. Updates the @highlights cache and creates event
  // listeners on the annotator object.
  //
  // Returns nothing.
  pluginInit() {
    for (let filter of Array.from(this.options.filters)) {
      this.addFilter(filter);
    }

    this.updateHighlights();
    this._setupListeners()._insertSpacer();

    if (this.options.addAnnotationFilter === true) {
      return this.addFilter({label: Annotator._t('Annotation'), property: 'text'});
    }
  }

  // Public: remove the filter plugin instance and unbind events.
  //
  // Returns nothing.
  destroy() {
    super.destroy(...arguments);
    const html = $('html');
    const currentMargin = parseInt(html.css('padding-top'), 10) || 0;
    html.css('padding-top', currentMargin - this.element.outerHeight());
    return this.element.remove();
  }

  // Adds margin to the current document to ensure that the annotation toolbar
  // doesn't cover the page when not scrolled.
  //
  // Returns itself
  _insertSpacer() {
    const html = $('html');
    const currentMargin = parseInt(html.css('padding-top'), 10) || 0;
    html.css('padding-top', currentMargin + this.element.outerHeight());
    return this;
  }

  // Listens to annotation change events on the Annotator in order to refresh
  // the @annotations collection.
  // TODO: Make this more granular so the entire collection isn't reloaded for
  // every single change.
  //
  // Returns itself.
  _setupListeners() {
    const events = [
      'annotationsLoaded', 'annotationCreated',
      'annotationUpdated', 'annotationDeleted'
    ];

    for (let event of Array.from(events)) {
      this.annotator.subscribe(event, this.updateHighlights);
    }
    return this;
  }

  // Public: Adds a filter to the toolbar. The filter must have both a label
  // and a property of an annotation object to filter on.
  //
  // options - An Object literal containing the filters options.
  //           label      - A public facing String to represent the filter.
  //           property   - An annotation property String to filter on.
  //           isFiltered - A callback Function that recieves the field input
  //                        value and the annotation property value. See
  //                        @options.isFiltered() for details.
  //
  // Examples
  //
  //   # Set up a filter to filter on the annotation.user property.
  //   filter.addFilter({
  //     label: User,
  //     property: 'user'
  //   })
  //
  // Returns itself to allow chaining.
  addFilter(options) {
    const filter = $.extend({
      label: '',
      property: '',
      isFiltered: this.options.isFiltered
    }, options);

    // Skip if a filter for this property has been loaded.
    if (!(Array.from(this.filters).filter((f) => f.property === filter.property)).length) {
      filter.id = `annotator-filter-${filter.property}`;
      filter.annotations = [];
      filter.element = this.filter.clone().appendTo(this.element);
      filter.element.find('label')
        .html(filter.label)
        .attr('for', filter.id);
      filter.element.find('input')
        .attr({
          id: filter.id,
          placeholder: Annotator._t('Filter by ') + filter.label + '\u2026'
        });
      filter.element.find('button').hide();

      // Add the filter to the elements data store.
      filter.element.data('filter', filter);

      this.filters.push(filter);
    }

    return this;
  }

  // Public: Updates the filter.annotations property. Then updates the state
  // of the elements in the DOM. Calls the filter.isFiltered() method to
  // determine if the annotation should remain.
  //
  // filter - A filter Object from @filters
  //
  // Examples
  //
  //   filter.updateFilter(myFilter)
  //
  // Returns itself for chaining
  updateFilter(filter) {
    filter.annotations = [];

    this.updateHighlights();
    this.resetHighlights();
    const input = $.trim(filter.element.find('input').val());

    if (input) {
      const annotations = this.highlights.map(function() { return $(this).data('annotation'); });

      for (let annotation of Array.from($.makeArray(annotations))) {
        const property = annotation[filter.property];
        if (filter.isFiltered(input, property)) {
          filter.annotations.push(annotation);
        }
      }

      return this.filterHighlights();
    }
  }

  // Public: Updates the @highlights property with the latest highlight
  // elements in the DOM.
  //
  // Returns a jQuery collection of the highlight elements.
  updateHighlights() {
    // Ignore any hidden highlights.
    this.highlights = this.annotator.element.find('.annotator-hl:visible');
    return this.filtered   = this.highlights.not(this.classes.hl.hide);
  }

  // Public: Runs through each of the filters and removes all highlights not
  // currently in scope.
  //
  // Returns itself for chaining.
  filterHighlights() {
    const activeFilters = $.grep(this.filters, filter => !!filter.annotations.length);

    let filtered = (activeFilters[0] != null ? activeFilters[0].annotations : undefined) || [];
    if (activeFilters.length > 1) {
      // If there are more than one filter then only annotations matched in every
      // filter should remain.
      const annotations = [];
      $.each(activeFilters, function() {
        return $.merge(annotations, this.annotations);
      });

      const uniques  = [];
      filtered = [];
      $.each(annotations, function() {
        if ($.inArray(this, uniques) === -1) {
          return uniques.push(this);
        } else {
          return filtered.push(this);
        }
      });
    }

    let { highlights } = this;
    for (let index = 0; index < filtered.length; index++) {
      const annotation = filtered[index];
      highlights = highlights.not(annotation.highlights);
    }

    highlights.addClass(this.classes.hl.hide);

    this.filtered = this.highlights.not(this.classes.hl.hide);
    return this;
  }

  // Public: Removes hidden class from all annotations.
  //
  // Returns itself for chaining.
  resetHighlights() {
    this.highlights.removeClass(this.classes.hl.hide);
    this.filtered = this.highlights;
    return this;
  }

  // Updates the filter field on focus.
  //
  // event - A focus Event object.
  //
  // Returns nothing
  _onFilterFocus(event) {
    const input = $(event.target);
    input.parent().addClass(this.classes.active);
    return input.next('button').show();
  }

  // Updates the filter field on blur.
  //
  // event - A blur Event object.
  //
  // Returns nothing.
  _onFilterBlur(event) {
    if (!event.target.value) {
      const input = $(event.target);
      input.parent().removeClass(this.classes.active);
      return input.next('button').hide();
    }
  }

  // Updates the filter based on the id of the filter element.
  //
  // event - A keyup Event
  //
  // Returns nothing.
  _onFilterKeyup(event) {
    const filter = $(event.target).parent().data('filter');
    if (filter) { return this.updateFilter(filter); }
  }

  // Locates the next/previous highlighted element in @highlights from the
  // current one or goes to the very first/last element respectively.
  //
  // previous - If true finds the previously highlighted element.
  //
  // Returns itself.
  _findNextHighlight(previous) {
    if (!this.highlights.length) { return this; }

    const offset      = previous ? 0    : -1;
    const resetOffset = previous ? -1   : 0;
    const operator    = previous ? 'lt' : 'gt';

    const active  = this.highlights.not(`.${this.classes.hl.hide}`);
    let current = active.filter(`.${this.classes.hl.active}`);
    if (!current.length) { current = active.eq(offset); }

    const annotation = current.data('annotation');

    const index = active.index(current[0]);
    let next  = active.filter(`:${operator}(${index})`).not(annotation.highlights).eq(resetOffset);
    if (!next.length) { next  = active.eq(resetOffset); }

    return this._scrollToHighlight(next.data('annotation').highlights);
  }

  // Locates the next highlighted element in @highlights from the current one
  // or goes to the very first element.
  //
  // event - A click Event.
  //
  // Returns nothing
  _onNextClick(event) {
    return this._findNextHighlight();
  }

  // Locates the previous highlighted element in @highlights from the current one
  // or goes to the very last element.
  //
  // event - A click Event.
  //
  // Returns nothing
  _onPreviousClick(event) {
    return this._findNextHighlight(true);
  }

  // Scrolls to the highlight provided. An adds an active class to it.
  //
  // highlight - Either highlight Element or an Array of elements. This value
  //             is usually retrieved from annotation.highlights.
  //
  // Returns nothing.
  _scrollToHighlight(highlight) {
    highlight = $(highlight);

    this.highlights.removeClass(this.classes.hl.active);
    highlight.addClass(this.classes.hl.active);

    return $('html, body').animate({
      scrollTop: highlight.offset().top - (this.element.height() + 20)
    }, 150);
  }

  // Clears the relevant input when the clear button is clicked.
  //
  // event - A click Event object.
  //
  // Returns nothing.
  _onClearClick(event) {
    return $(event.target).prev('input').val('').keyup().blur();
  }
});
Cls.initClass();
