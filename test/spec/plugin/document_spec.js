/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Plugin.Document', function() {
  const $fix = null;
  let annotator = null;

  beforeEach(function() {
    annotator = new Annotator($('<div></div>')[0], {});
    return annotator.addPlugin('Document');
  });

  afterEach(() => $(document).unbind());

  describe('has an annotator', () =>
    it('should have an annotator', () => assert.ok(annotator))
  );

  describe('has the plugin', () =>
    it('should have Document plugin', () => assert.ok('Document' in annotator.plugins))
  );

  describe('annotation should have some metadata', function() {
    // add some metadata to the page
    const head = $("head");
    head.append('<link rel="alternate" href="foo.pdf" type="application/pdf"></link>');
    head.append('<link rel="alternate" href="foo.doc" type="application/msword"></link>');
    head.append('<link rel="bookmark" href="http://example.com/bookmark"></link>');
    head.append('<link rel="shortlink" href="http://example.com/bookmark/short"></link>');
    head.append('<link rel="alternate" href="es/foo.html" hreflang="es" type="text/html"></link>');
    head.append('<meta name="citation_doi" content="10.1175/JCLI-D-11-00015.1">');
    head.append('<meta name="citation_title" content="Foo">');
    head.append('<meta name="citation_pdf_url" content="foo.pdf">');
    head.append('<meta name="dc.identifier" content="doi:10.1175/JCLI-D-11-00015.1">');
    head.append('<meta name="dc.identifier" content="isbn:123456789">');
    head.append('<meta name="DC.type" content="Article">');
    head.append('<meta property="og:url" content="http://example.com">');
    head.append('<meta name="twitter:site" content="@okfn">');
    head.append('<link rel="icon" href="http://example.com/images/icon.ico"></link>');
    head.append('<meta name="eprints.title" content="Computer Lib / Dream Machines">');
    head.append('<meta name="prism.title" content="Literary Machines">');
    head.append('<link rel="alternate" href="feed" type="application/rss+xml"></link>');
    head.append('<link rel="canonical" href="http://example.com/canonical"></link>');

    let annotation = null;

    beforeEach(() => annotation = annotator.createAnnotation());

    it('can create annotation', () => assert.ok(annotation));

    it('should have a document', () => assert.ok(annotation.document));

    it('should have a title, derived from highwire metadata if possible', () => assert.equal(annotation.document.title, 'Foo'));

    it('should have links with absolute hrefs and types', function() {
      assert.ok(annotation.document.link);
      assert.equal(annotation.document.link.length, 9);
      assert.match(annotation.document.link[0].href, /^.+runner.html(\?.*)?$/);
      assert.equal(annotation.document.link[1].rel, "alternate");
      assert.match(annotation.document.link[1].href, /^.+foo\.pdf$/);
      assert.equal(annotation.document.link[1].type, "application/pdf");
      assert.equal(annotation.document.link[2].rel, "alternate");
      assert.match(annotation.document.link[2].href, /^.+foo\.doc$/);
      assert.equal(annotation.document.link[2].type, "application/msword");
      assert.equal(annotation.document.link[3].rel, "bookmark");
      assert.equal(annotation.document.link[3].href, "http://example.com/bookmark");
      assert.equal(annotation.document.link[4].rel, "shortlink");
      assert.equal(annotation.document.link[4].href, "http://example.com/bookmark/short");
      assert.equal(annotation.document.link[5].rel, "canonical");
      assert.equal(annotation.document.link[5].href, "http://example.com/canonical");
      assert.equal(annotation.document.link[6].href, "doi:10.1175/JCLI-D-11-00015.1");
      assert.match(annotation.document.link[7].href, /.+foo\.pdf$/);
      assert.equal(annotation.document.link[7].type, "application/pdf");
      return assert.equal(annotation.document.link[8].href, "doi:10.1175/JCLI-D-11-00015.1");
    });

    it('should ignore atom and RSS feeds and alternate languages', () => assert.equal(annotation.document.link.length, 9));

    it('should have highwire metadata', function() {
      assert.ok(annotation.document.highwire);
      assert.deepEqual(annotation.document.highwire.pdf_url, ['foo.pdf']);
      assert.deepEqual(annotation.document.highwire.doi, ['10.1175/JCLI-D-11-00015.1']);
      return assert.deepEqual(annotation.document.highwire.title, ['Foo']);
    });

    it('should have dublincore metadata', function() {
      assert.ok(annotation.document.dc);
      assert.deepEqual(annotation.document.dc.identifier, ["doi:10.1175/JCLI-D-11-00015.1", "isbn:123456789"]);
      return assert.deepEqual(annotation.document.dc.type, ["Article"]);
    });

    it('should have facebook metadata', function() {
      assert.ok(annotation.document.facebook);
      return assert.deepEqual(annotation.document.facebook.url, ["http://example.com"]);
    });

    it('should have eprints metadata', function() {
      assert.ok(annotation.document.eprints);
      return assert.deepEqual(annotation.document.eprints.title, ['Computer Lib / Dream Machines']);
    });

    it('should have prism metadata', function() {
      assert.ok(annotation.document.prism);
      return assert.deepEqual(annotation.document.prism.title, ['Literary Machines']);
    });

    it('should have twitter card metadata', function() {
      assert.ok(annotation.document.twitter);
      return assert.deepEqual(annotation.document.twitter.site, ['@okfn']);
     });
    
    it('should have unique uris', function() {
      const uris = annotator.plugins.Document.uris();
      return assert.equal(uris.length, 7);
    });

    it('uri() returns the canonical uri', function() {
      const uri = annotator.plugins.Document.uri();
      return assert.equal(uri, annotation.document.link[5].href);
    });

    return it('should have a favicon', () =>
      assert.equal(
        annotation.document.favicon,
        'http://example.com/images/icon.ico'
      )
    );
  });

  return describe('#_absoluteUrl', function() {
    let plugin = null;

    beforeEach(() => plugin = annotator.plugins.Document);

    it('should add the protocol when the url starts with two slashes', function() {
      const result = plugin._absoluteUrl('//example.com/');
      const expected = `${document.location.protocol}//example.com/`;
      return assert.equal(result, expected);
    });

    it('should add a trailing slash when given an empty path', function() {
      const result = plugin._absoluteUrl('http://example.com');
      return assert.equal(result, 'http://example.com/');
    });

    it('should make a relative path into an absolute url', function() {
      const result = plugin._absoluteUrl('path');
      const expected = (
        document.location.protocol + '//' +
        document.location.host +
        document.location.pathname.replace(/[^\/]+$/, '') +
        'path'
      );
      return assert.equal(result, expected);
    });

    return it('should make an absolute path into an absolute url', function() {
      const result = plugin._absoluteUrl('/path');
      const expected = (
        document.location.protocol + '//' +
        document.location.host +
        '/path'
      );
      return assert.equal(result, expected);
    });
  });
});
