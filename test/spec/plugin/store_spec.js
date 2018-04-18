/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("Annotator.Plugin.Store", function() {
  let store = null;

  beforeEach(function() {
    const element = $('<div></div>')[0];
    store = new Annotator.Plugin.Store(element, {autoFetch: false});
    return store.annotator = {
      plugins: {},
      loadAnnotations: sinon.spy()
    };});

  describe("events", function() {
    it("should call Store#annotationCreated when the annotationCreated is fired", function() {
      sinon.stub(store, 'annotationCreated');
      store.element.trigger('annotationCreated', ['annotation1']);
      return assert.isTrue(store.annotationCreated.calledWith('annotation1'));
    });

    it("should call Store#annotationUpdated when the annotationUpdated is fired", function() {
      sinon.stub(store, 'annotationUpdated');
      store.element.trigger('annotationUpdated', ['annotation1']);
      return assert.isTrue(store.annotationUpdated.calledWith('annotation1'));
    });

    return it("should call Store#annotationDeleted when the annotationDeleted is fired", function() {
      sinon.stub(store, 'annotationDeleted');
      store.element.trigger('annotationDeleted', ['annotation1']);
      return assert.isTrue(store.annotationDeleted.calledWith('annotation1'));
    });
  });

  describe("pluginInit", function() {
    it("should call Store#_getAnnotations() if no Auth plugin is loaded", function() {
      sinon.stub(store, '_getAnnotations');
      store.pluginInit();
      return assert(store._getAnnotations.calledOnce);
    });

    return it("should call Auth#withToken() if Auth plugin is loaded", function() {
      const authMock = {
        withToken: sinon.spy()
      };
      store.annotator.plugins.Auth = authMock;

      store.pluginInit();
      return assert.isTrue(authMock.withToken.calledWith(store._getAnnotations));
    });
  });

  describe("_getAnnotations", function() {
    it("should call Store#loadAnnotations() if @options.loadFromSearch is not present", function() {
      sinon.stub(store, 'loadAnnotations');
      store._getAnnotations();
      return assert(store.loadAnnotations.calledOnce);
    });

    return it("should call Store#loadAnnotationsFromSearch() if @options.loadFromSearch is present", function() {
      sinon.stub(store, 'loadAnnotationsFromSearch');

      store.options.loadFromSearch = {};
      store._getAnnotations();

      return assert.isTrue(store.loadAnnotationsFromSearch.calledWith(store.options.loadFromSearch));
    });
  });

  describe("annotationCreated", function() {
    let annotation = null;

    beforeEach(function() {
      annotation = {};
      sinon.stub(store, 'registerAnnotation');
      sinon.stub(store, 'updateAnnotation');
      return sinon.stub(store, '_apiRequest');
    });

    it("should call Store#registerAnnotation() with the new annotation", function() {
      store.annotationCreated(annotation);
      return assert.isTrue(store.registerAnnotation.calledWith(annotation));
    });

    it("should call Store#_apiRequest('create') with the new annotation", function() {
      store.annotationCreated(annotation);
      const { args } = store._apiRequest.lastCall;

      assert(store._apiRequest.calledOnce);
      assert.equal(args[0], 'create');
      return assert.equal(args[1], annotation);
    });

    return it("should call Store#updateAnnotation() if the annotation already exists in @annotations", function() {
      store.annotations = [annotation];
      store.annotationCreated(annotation);
      assert(store.updateAnnotation.calledOnce);
      return assert.equal(store.updateAnnotation.lastCall.args[0], annotation);
    });
  });

  describe("annotationUpdated", function() {
    let annotation = null;

    beforeEach(function() {
      annotation = {};
      return sinon.stub(store, '_apiRequest');
    });

    it("should call Store#_apiRequest('update') with the annotation and data", function() {
      store.annotations = [annotation];
      store.annotationUpdated(annotation);
      const { args } = store._apiRequest.lastCall;

      assert(store._apiRequest.calledOnce);
      assert.equal(args[0], 'update');
      assert.equal(args[1], annotation);
      assert.equal(typeof args[2], 'function');

      // Ensure the request callback works as expected.
      sinon.stub(store, 'updateAnnotation');

      const data = {text: "Dummy response data"};
      args[2](data);
      return assert.isTrue(store.updateAnnotation.calledWith(annotation, data));
    });

    return it("should NOT call Store#_apiRequest() if the annotation is unregistered", function() {
      store.annotations = [];
      store.annotationUpdated(annotation);

      return assert.isFalse(store._apiRequest.called);
    });
  });

  describe("annotationDeleted", function() {
    let annotation = null;

    beforeEach(function() {
      annotation = {};
      return sinon.stub(store, '_apiRequest');
    });

    it("should call Store#_apiRequest('destroy') with the annotation and data", function() {
      store.annotations = [annotation];
      store.annotationDeleted(annotation);
      const { args } = store._apiRequest.lastCall;

      assert(store._apiRequest.calledOnce);
      assert.equal(args[0], 'destroy');
      return assert.equal(args[1], annotation);
    });

    return it("should NOT call Store#_apiRequest() if the annotation is unregistered", function() {
      store.annotations = [];
      store.annotationDeleted(annotation);

      return assert.isFalse(store._apiRequest.called);
    });
  });

  describe("registerAnnotation", () =>
    it("should add the annotation to the @annotations array", function() {
      const annotation = {};
      store.annotations = [];
      store.registerAnnotation(annotation);
      return assert.equal($.inArray(annotation, store.annotations), 0);
    })
  );

  describe("unregisterAnnotation", () =>
    it("should remove the annotation from the @annotations array", function() {
      const annotation = {};
      store.annotations = [annotation];
      store.unregisterAnnotation(annotation);
      return assert.equal($.inArray(annotation, store.annotations), -1);
    })
  );

  describe("updateAnnotation", function() {
    let annotation = {};

    beforeEach(function() {
      sinon.stub(console, 'error');
      annotation = {
        text: "my annotation text",
        range: []
      };
      return store.annotations = [annotation];});

    afterEach(() => console.error.restore());

    it("should extend the annotation with the data provided", function() {
      store.updateAnnotation(annotation, {
        id: "myid",
        text: "new text"
      });
      return assert.deepEqual(annotation, {
        id: "myid",
        text: "new text",
        range: []
      });
    });

    it("should NOT extend the annotation if it is not registered with the Store", function() {
      store.annotations = [];
      store.updateAnnotation(annotation, {
        id: "myid",
        text: "new text"
      });
      return assert.equal(annotation, annotation);
    });

    return it("should update the data stored on the annotation highlight", function() {
      const data = {};
      annotation.highlight = $('<span />').data('annotation', annotation);
      store.updateAnnotation(annotation, data);
      return assert.equal(annotation.highlight.data('annotation'), annotation);
    });
  });

  describe("loadAnnotations", () =>
    it("should call Store#_apiRequest()", function() {
      sinon.stub(store, '_apiRequest');
      store.loadAnnotations();
      return assert.isTrue(store._apiRequest.calledWith('read', null, store._onLoadAnnotations));
    })
  );

  describe("loadAnnotationsFromSearch", () =>
    it("should call Store#_apiRequest()", function() {
      const options = {};

      sinon.stub(store, '_apiRequest');
      store.loadAnnotationsFromSearch(options);

      return assert.isTrue(store._apiRequest.calledWith('search', options, store._onLoadAnnotationsFromSearch));
    })
  );

  describe("_onLoadAnnotations", function() {
    it("should set the Store#annotations property with received annotations", function() {
      const data = [1,2,3];
      store._onLoadAnnotations(data);
      return assert.deepEqual(store.annotations, data);
    });

    it("should default to an empty array if no data is provided", function() {
      store._onLoadAnnotations();
      return assert.deepEqual(store.annotations, []);
    });

    it("should call Annotator#loadAnnotations()", function() {
      store._onLoadAnnotations();
      return assert(store.annotator.loadAnnotations.calledOnce);
    });

    it("should call Annotator#loadAnnotations() with clone of provided data", function() {
      const data = [];
      store._onLoadAnnotations(data);
      assert.notStrictEqual(store.annotator.loadAnnotations.lastCall.args[0], data);
      return assert.deepEqual(store.annotator.loadAnnotations.lastCall.args[0], data);
    });

    return it("should add, dedupe and update annotations when called for the 2nd time", function() {
      const data1 = [{id: 1}, {id: 2}];
      const data2 = [{id: 1, foo: "bar"}, {id: 3}];
      const dataAll = [{id: 1, foo: "bar"}, {id: 2}, {id: 3}];
      store._onLoadAnnotations(data1);
      store._onLoadAnnotations(data2);
      return assert.deepEqual(store.annotations, dataAll);
    });
  });

  describe("_onLoadAnnotationsFromSearch", function() {
    it("should call Store#_onLoadAnnotations() with data.rows", function() {
      sinon.stub(store, '_onLoadAnnotations');

      const data = {rows: [{}, {}, {}]};
      store._onLoadAnnotationsFromSearch(data);
      return assert.deepEqual(store._onLoadAnnotations.lastCall.args[0], data.rows);
    });

    return it("should default to an empty array if no data.rows are provided", function() {
      sinon.stub(store, '_onLoadAnnotations');

      store._onLoadAnnotationsFromSearch();
      return assert.deepEqual(store._onLoadAnnotations.lastCall.args[0], []);
    });
  });

  describe("dumpAnnotations", function() {
    it("returns a list of its annotations", function() {
      store.annotations = [{text: "Foobar"}, {user: "Bob"}];
      return assert.deepEqual(store.dumpAnnotations(), [{text: "Foobar"}, {user: "Bob"}]);
    });

    return it("removes the highlights properties from the annotations", function() {
      store.annotations = [{highlights: "abc"}, {highlights: [1,2,3]}];
      return assert.deepEqual(store.dumpAnnotations(), [{}, {}]);
    });
  });

  describe("_apiRequest", function() {
    const mockUri     = 'http://mock.com';
    const mockOptions = {};

    beforeEach(function() {
      sinon.stub(store, '_urlFor').returns(mockUri);
      sinon.stub(store, '_apiRequestOptions').returns(mockOptions);
      return sinon.stub($, 'ajax').returns({});
    });

    afterEach(() => $.ajax.restore());

    it("should call Store#_urlFor() with the action", function() {
      const action = 'read';

      store._apiRequest(action);
      return assert.isTrue(store._urlFor.calledWith(action, undefined));
    });

    it("should call Store#_urlFor() with the action and id extracted from the data", function() {
      const data   = {id: 'myId'};
      const action = 'read';

      store._apiRequest(action, data);
      return assert.isTrue(store._urlFor.calledWith(action, data.id));
    });

    it("should call Store#_apiRequestOptions() with the action, data and callback", function() {
      const data     = {id: 'myId'};
      const action   = 'read';
      const callback = function() {};

      store._apiRequest(action, data, callback);
      return assert.isTrue(store._apiRequestOptions.calledWith(action, data, callback));
    });

    it("should call jQuery#ajax()", function() {
      store._apiRequest();
      return assert.isTrue($.ajax.calledWith(mockUri, mockOptions));
    });

    return it("should return the jQuery XHR object with action and id appended", function() {
      const data     = {id: 'myId'};
      const action   = 'read';

      const request = store._apiRequest(action, data);
      assert.equal(request._id, data.id);
      return assert.equal(request._action, action);
    });
  });

  describe("_apiRequestOptions", function() {
    beforeEach(() => sinon.stub(store, '_dataFor').returns('{}'));

    it("should call Store#_methodFor() with the action", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      const action = 'read';
      store._apiRequestOptions(action);
      return assert.isTrue(store._methodFor.calledWith(action));
    });

    it("should return options for jQuery.ajax()", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      const action   = 'read';
      const data     = {};
      const callback = function() {};

      const options = store._apiRequestOptions(action, data, callback);
      return assert.deepEqual(options, {
        type:        'GET',
        headers:     undefined,
        dataType:    "json",
        success:     callback,
        error:       store._onError,
        data:        '{}',
        contentType: "application/json; charset=utf-8"
      });
    });

    it("should set custom headers from the data property 'annotator:headers'", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      sinon.stub(store.element, 'data').returns({
        'x-custom-header-one':   'mycustomheader',
        'x-custom-header-two':   'mycustomheadertwo',
        'x-custom-header-three': 'mycustomheaderthree'
      });

      const action   = 'read';
      const data     = {};

      const options = store._apiRequestOptions(action, data);

      return assert.deepEqual(options.headers, {
        'x-custom-header-one':   'mycustomheader',
        'x-custom-header-two':   'mycustomheadertwo',
        'x-custom-header-three': 'mycustomheaderthree'
      });
    });

    it("should call Store#_dataFor() with the data if action is NOT search", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      const action = 'read';
      const data   = {};
      store._apiRequestOptions(action, data);
      return assert.isTrue(store._dataFor.calledWith(data));
    });

    it("should NOT call Store#_dataFor() if action is search", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      const action = 'search';
      const data   = {};
      store._apiRequestOptions(action, data);
      return assert.isFalse(store._dataFor.called);
    });

    it("should NOT add the contentType property if the action is search", function() {
      sinon.stub(store, '_methodFor').returns('GET');
      const action   = 'search';
      const data     = {};

      const options = store._apiRequestOptions(action, data);
      assert.isUndefined(options.contentType);
      return assert.equal(options.data, data);
    });

    it("should emulate new-fangled HTTP if emulateHTTP is true", function() {
      sinon.stub(store, '_methodFor').returns('DELETE');

      store.options.emulateHTTP = true;
      const options = store._apiRequestOptions('destroy', {id: 4});

      assert.equal(options.type, 'POST');
      return assert.deepEqual(options.headers, {
        'X-HTTP-Method-Override': 'DELETE'
      });
    });

    it("should emulate proper JSON handling if emulateJSON is true", function() {
      sinon.stub(store, '_methodFor').returns('DELETE');

      store.options.emulateJSON = true;
      const options = store._apiRequestOptions('destroy', {});

      assert.deepEqual(options.data, {
        json: '{}',
      });
      return assert.isUndefined(options.contentType);
    });

    return it("should append _method to the form data if emulateHTTP and emulateJSON are both true", function() {
      sinon.stub(store, '_methodFor').returns('DELETE');

      store.options.emulateHTTP = true;
      store.options.emulateJSON = true;
      const options = store._apiRequestOptions('destroy', {});

      return assert.deepEqual(options.data, {
        _method: 'DELETE',
        json: '{}',
      });
    });
  });

  describe("_urlFor", function() {
    it("should generate RESTful URLs by default", function() {
      assert.equal(store._urlFor('create'), '/store/annotations');
      assert.equal(store._urlFor('read'), '/store/annotations');
      assert.equal(store._urlFor('read', 'foo'), '/store/annotations/foo');
      assert.equal(store._urlFor('update', 'bar'), '/store/annotations/bar');
      return assert.equal(store._urlFor('destroy', 'baz'), '/store/annotations/baz');
    });

    it("should generate URLs as specified by its options otherwise", function() {
      store.options.prefix = '/some/prefix';
      store.options.urls.create = '/createMe';
      store.options.urls.read = '/:id/readMe';
      store.options.urls.update = '/:id/updateMe';
      store.options.urls.destroy = '/:id/destroyMe';
      assert.equal(store._urlFor('create'), '/some/prefix/createMe');
      assert.equal(store._urlFor('read'), '/some/prefix/readMe');
      assert.equal(store._urlFor('read', 'foo'), '/some/prefix/foo/readMe');
      assert.equal(store._urlFor('update', 'bar'), '/some/prefix/bar/updateMe');
      return assert.equal(store._urlFor('destroy', 'baz'), '/some/prefix/baz/destroyMe');
    });

    it("should generate URLs correctly with an empty prefix", function() {
      store.options.prefix = '';
      store.options.urls.create = '/createMe';
      store.options.urls.read = '/:id/readMe';
      store.options.urls.update = '/:id/updateMe';
      store.options.urls.destroy = '/:id/destroyMe';
      assert.equal(store._urlFor('create'), '/createMe');
      assert.equal(store._urlFor('read'), '/readMe');
      assert.equal(store._urlFor('read', 'foo'), '/foo/readMe');
      assert.equal(store._urlFor('update', 'bar'), '/bar/updateMe');
      return assert.equal(store._urlFor('destroy', 'baz'), '/baz/destroyMe');
    });

    return it("should generate URLs with substitution markers in query strings", function() {
      store.options.prefix = '/some/prefix';
      store.options.urls.read = '/read?id=:id';
      store.options.urls.update = '/update?foo&id=:id';
      store.options.urls.destroy = '/delete?id=:id&foo';
      assert.equal(store._urlFor('read'), '/some/prefix/read?id=');
      assert.equal(store._urlFor('read', 'foo'), '/some/prefix/read?id=foo');
      assert.equal(store._urlFor('update', 'bar'), '/some/prefix/update?foo&id=bar');
      return assert.equal(store._urlFor('destroy', 'baz'), '/some/prefix/delete?id=baz&foo');
    });
  });

  describe("_methodFor", () =>
    it("should return the appropriate method for the action", function() {
      const table = {
        'create':  'POST',
        'read':    'GET',
        'update':  'PUT',
        'destroy': 'DELETE',
        'search':  'GET'
      };
      return Array.from(table).map((action, method) =>
        assert.equal(store._methodFor(action, method)));
    })
  );

  describe("_dataFor", function() {
    it("should stringify the annotation into JSON", function() {
      const annotation = {id: 'bill'};
      const data = store._dataFor(annotation);
      return assert.equal(data, '{"id":"bill"}');
    });

    it("should NOT stringify the highlights property", function() {
      const annotation = {id: 'bill', highlights: {}};
      const data = store._dataFor(annotation);
      return assert.equal(data, '{"id":"bill"}');
    });

    it("should NOT append a highlights property if the annotation does not have one", function() {
      const annotation = {id: 'bill'};
      store._dataFor(annotation);
      return assert.isFalse(annotation.hasOwnProperty('highlights'));
    });

    return it("should extend the annotation with @options.annotationData", function() {
      const annotation = {id: "cat"};
      store.options.annotationData = {custom: 'value', customArray: []};
      const data = store._dataFor(annotation);

      assert.equal(data, '{"id":"cat","custom":"value","customArray":[]}');
      return assert.deepEqual(annotation, {"id":"cat", "custom":"value", "customArray":[]});
    });
  });

  return describe("_onError", function() {
    let message = null;
    const requests = [
      {},
      {},
      {_action: 'read', _id: 'jim'},
      {_action: 'search'},
      {_action: 'read'},
      {status: 401, _action: 'delete', '_id': 'cake'},
      {status: 404, _action: 'delete', '_id': 'cake'},
      {status: 500, _action: 'delete', '_id': 'cake'}
    ];

    beforeEach(function() {
      sinon.stub(Annotator, 'showNotification');
      sinon.stub(console,   'error');

      store._onError(requests.shift());
      return message = Annotator.showNotification.lastCall.args[0];});

    afterEach(function() {
      Annotator.showNotification.restore();
      return console.error.restore();
    });

    it("should call call Annotator.showNotification() with a message and error style", function() {
      assert(Annotator.showNotification.calledOnce);
      return assert.equal(Annotator.showNotification.lastCall.args[1], Annotator.Notification.ERROR);
    });

    it("should call console.error with a message", () => assert(console.error.calledOnce));

    it("should give a default message if xhr.status id not provided", () => assert.equal(message, "Sorry we could not read this annotation"));

    it("should give a default specific message if xhr._action is 'search'", () => assert.equal(message, "Sorry we could not search the store for annotations"));

    it("should give a default specific message if xhr._action is 'read' and there is no xhr._id", () => assert.equal(message, "Sorry we could not read the annotations from the store"));

    it("should give a specific message if xhr.status == 401", () => assert.equal(message, "Sorry you are not allowed to delete this annotation"));

    it("should give a specific message if xhr.status == 404", () => assert.equal(message, "Sorry we could not connect to the annotations store"));

    return it("should give a specific message if xhr.status == 500", () => assert.equal(message, "Sorry something went wrong with the annotation store"));
  });
});
