/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Cls = (this.MockSelection = class MockSelection {
  static initClass() {
    this.prototype.rangeCount = 1;
    this.prototype.isCollapsed = false;
  }

  constructor(fixElem, data) {

    this.root = fixElem;
    this.rootXPath = Util.xpathFromNode($(fixElem))[0];

    this.startContainer = this.resolvePath(data[0]);
    this.startOffset    = data[1];
    this.endContainer   = this.resolvePath(data[2]);
    this.endOffset      = data[3];
    this.expectation    = data[4];
    this.description    = data[5];

    this.commonAncestor = this.startContainer;
    while (!Util.contains(this.commonAncestor, this.endContainer)) {
      this.commonAncestor = this.commonAncestor.parentNode;
    }
    this.commonAncestorXPath = Util.xpathFromNode($(this.commonAncestor))[0];
  }

  getRangeAt() {
    return {
      startContainer: this.startContainer,
      startOffset:    this.startOffset,
      endContainer:   this.endContainer,
      endOffset:      this.endOffset,
      commonAncestorContainer: this.commonAncestor
    };
  }

  resolvePath(path) {
    if (typeof path === "number") {
      return Util.getTextNodes($(this.root))[path];
    } else if (typeof path === "string") {
      return this.resolveXPath(this.rootXPath + path);
    }
  }

  resolveXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }
});
Cls.initClass();

this.textInNormedRange = function(range) {
  let textNodes = Util.getTextNodes($(range.commonAncestor));
  textNodes = textNodes.slice(textNodes.index(range.start), +textNodes.index(range.end) + 1 || undefined).get();
  return textNodes.reduce(((acc, next) => acc += next.nodeValue), "");
};

this.DateToISO8601String = function(format, offset) {
  let date;
  if (format == null) { format = 6; }
  /*
  accepted values for the format [1-6]:
   1 Year:
     YYYY (eg 1997)
   2 Year and month:
     YYYY-MM (eg 1997-07)
   3 Complete date:
     YYYY-MM-DD (eg 1997-07-16)
   4 Complete date plus hours and minutes:
     YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
   5 Complete date plus hours, minutes and seconds:
     YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
   6 Complete date plus hours, minutes, seconds and a decimal
     fraction of a second
     YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
  */
  if (!offset) {
    offset = 'Z';
    date = this;
  } else {
    const d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
    let offsetnum = (Number(d[2]) * 60) + Number(d[3]);
    offsetnum *= d[1] === '-' ? -1 : 1;
    date = new Date(Number(Number(this) + (offsetnum * 60000)));
  }

  const zeropad = num => (num < 10 ? '0' : '') + num;

  let str = "";
  str += date.getUTCFullYear();
  if (format > 1) {
    str += `-${zeropad(date.getUTCMonth() + 1)}`;
  }
  if (format > 2) {
    str += `-${zeropad(date.getUTCDate())}`;
  }
  if (format > 3) {
    str += `T${zeropad(date.getUTCHours())}:${zeropad(date.getUTCMinutes())}`;
  }

  if (format > 5) {
    const secs = Number(date.getUTCSeconds() + "." + (date.getUTCMilliseconds() < 100 ? '0' : '') + zeropad(date.getUTCMilliseconds()));
    str += `:${zeropad(secs)}`;
  } else if (format > 4) {
    str += `:${zeropad(date.getUTCSeconds())}`;
  }

  if (format > 3) {
    str += offset;
  }

  return str;
};

// Ajax fixtures helpers

let fixtureElem = document.getElementById('fixtures');
const fixtureMemo = {};

this.setFixtureElem = elem => fixtureElem = elem;

this.fix = () => fixtureElem;

this.getFixture = function(fname) {
  if ((fixtureMemo[fname] == null)) {
    fixtureMemo[fname] = $.ajax({
      url: `fixtures/${fname}.html`,
      async: false
    }).responseText;
  }

  return fixtureMemo[fname];
};

this.addFixture = function(fname) {
  return $(this.getFixture(fname)).appendTo(fixtureElem);
};

this.clearFixtures = () => $(fixtureElem).empty();
