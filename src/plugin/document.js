/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
(function() {
  let $ = undefined;
  const Cls = (Annotator.Plugin.Document = class Document extends Annotator.Plugin {
    constructor(...args) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.uri = this.uri.bind(this);
      this.uris = this.uris.bind(this);
      this.beforeAnnotationCreated = this.beforeAnnotationCreated.bind(this);
      this.getDocumentMetadata = this.getDocumentMetadata.bind(this);
      this._getHighwire = this._getHighwire.bind(this);
      this._getFacebook = this._getFacebook.bind(this);
      this._getTwitter = this._getTwitter.bind(this);
      this._getDublinCore = this._getDublinCore.bind(this);
      this._getPrism = this._getPrism.bind(this);
      this._getEprints = this._getEprints.bind(this);
      this._getMetaTags = this._getMetaTags.bind(this);
      this._getTitle = this._getTitle.bind(this);
      this._getLinks = this._getLinks.bind(this);
      this._getFavicon = this._getFavicon.bind(this);
      super(...args);
    }

    static initClass() {
  
      ({ $ } = Annotator);
    
      this.prototype.events =
        {'beforeAnnotationCreated': 'beforeAnnotationCreated'};
    }

    pluginInit() {
      return this.getDocumentMetadata();
    }

    // returns the primary URI for the document being annotated
  
    uri() {
      let uri = decodeURIComponent(document.location.href);
      for (let link of Array.from(this.metadata.link)) {
        if (link.rel === "canonical") {
          uri = link.href;
        }
      }
      return uri;
    }

    // returns all uris for the document being annotated

    uris() {
      let href;
      const uniqueUrls = {};
      for (let link of Array.from(this.metadata.link)) {
        if (link.href) { uniqueUrls[link.href] = true; }
      }
      return ((() => {
        const result = [];
        for (href in uniqueUrls) {
          result.push(href);
        }
        return result;
      })());
    }

    beforeAnnotationCreated(annotation) {
      return annotation.document = this.metadata;
    }

    getDocumentMetadata() {
      this.metadata = {};

      // first look for some common metadata types
      // TODO: look for microdata/rdfa?
      this._getHighwire();
      this._getDublinCore();
      this._getFacebook();
      this._getEprints();
      this._getPrism();
      this._getTwitter();
      this._getFavicon();

      // extract out/normalize some things
      this._getTitle();
      this._getLinks();

      return this.metadata;
    }

    _getHighwire() {
      return this.metadata.highwire = this._getMetaTags("citation", "name", "_");
    }

    _getFacebook() {
      return this.metadata.facebook = this._getMetaTags("og", "property", ":");
    }

    _getTwitter() {
      return this.metadata.twitter = this._getMetaTags("twitter", "name", ":");
    }

    _getDublinCore() {
      return this.metadata.dc = this._getMetaTags("dc", "name", ".");
    }

    _getPrism() {
      return this.metadata.prism = this._getMetaTags("prism", "name", ".");
    }

    _getEprints() {
      return this.metadata.eprints = this._getMetaTags("eprints", "name", ".");
    }

    _getMetaTags(prefix, attribute, delimiter) {
      const tags = {};
      for (let meta of Array.from($("meta"))) {
        const name = $(meta).attr(attribute);
        const content = $(meta).prop("content");
        if (name) {
          const match = name.match(RegExp(`^${prefix}${delimiter}(.+)$`, "i"));
          if (match) {
            const n = match[1];
            if (tags[n]) {
              tags[n].push(content);
            } else {
              tags[n] = [content];
            }
          }
        }
      }
      return tags;
    }

    _getTitle() {
      if (this.metadata.highwire.title) {
        return this.metadata.title = this.metadata.highwire.title[0];
      } else if (this.metadata.eprints.title) {
        return this.metadata.title = this.metadata.eprints.title[0];
      } else if (this.metadata.prism.title) {
        return this.metadata.title = this.metadata.prism.title[0];
      } else if (this.metadata.facebook.title) {
        return this.metadata.title = this.metadata.facebook.title[0];
      } else if (this.metadata.twitter.title) {
        return this.metadata.title = this.metadata.twitter.title[0];
      } else if (this.metadata.dc.title) {
        return this.metadata.title = this.metadata.dc.title[0];
      } else {
        return this.metadata.title = $("head title").text();
      }
    }
 
    _getLinks() {
      // we know our current location is a link for the document
      let href, type, values;
      this.metadata.link = [{href: document.location.href}];

      // look for some relevant link relations
      for (let link of Array.from($("link"))) {
        const l = $(link);
        href = this._absoluteUrl(l.prop('href')); // get absolute url
        const rel = l.prop('rel');
        type = l.prop('type');
        const lang = l.prop('hreflang');

        if (!["alternate", "canonical", "bookmark", "shortlink"].includes(rel)) { continue; }

        if (rel === 'alternate') {
          // Ignore feeds resources
          if (type && type.match(/^application\/(rss|atom)\+xml/)) { continue; }
          // Ignore alternate languages
          if (lang) { continue; }
        }

        this.metadata.link.push({href, rel, type});
      }

      // look for links in scholar metadata
      for (var name in this.metadata.highwire) {

        values = this.metadata.highwire[name];
        if (name === "pdf_url") {
          for (let url of Array.from(values)) {
            this.metadata.link.push({
              href: this._absoluteUrl(url),
              type: "application/pdf"
            });
          }
        }

        // kind of a hack to express DOI identifiers as links but it's a 
        // convenient place to look them up later, and somewhat sane since 
        // they don't have a type
    
        if (name === "doi") {
          for (let doi of Array.from(values)) {
            if (doi.slice(0, 4) !== "doi:") {
              doi = `doi:${doi}`;
            }
            this.metadata.link.push({href: doi});
          }
        }
      }

      // look for links in dublincore data
      return (() => {
        const result = [];
        for (name in this.metadata.dc) {
          values = this.metadata.dc[name];
          if (name === "identifier") {
            result.push((() => {
              const result1 = [];
              for (let id of Array.from(values)) {
                if (id.slice(0, 4) === "doi:") {
                  result1.push(this.metadata.link.push({href: id}));
                } else {
                  result1.push(undefined);
                }
              }
              return result1;
            })());
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }

    _getFavicon() {
      return (() => {
        const result = [];
        for (let link of Array.from($("link"))) {
          var needle;
          if ((needle = $(link).prop("rel"), ["shortcut icon", "icon"].includes(needle))) {
            result.push(this.metadata["favicon"] = this._absoluteUrl(link.href));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
        
    // hack to get a absolute url from a possibly relative one
  
    _absoluteUrl(url) {
      const d = document.createElement('a');
      d.href = url;
      return d.href;
    }
  });
  Cls.initClass();
  return Cls;
})();
