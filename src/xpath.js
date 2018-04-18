/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A simple XPath evaluator using jQuery which can evaluate queries of
const simpleXPathJQuery = function(relativeRoot) {
  const jq = this.map(function() {
    let path = '';
    let elem = this;

    while (((elem != null ? elem.nodeType : undefined) === Node.ELEMENT_NODE) && (elem !== relativeRoot)) {
      const tagName = elem.tagName.replace(":", "\\:");
      let idx = $(elem.parentNode).children(tagName).index(elem) + 1;

      idx  = `[${idx}]`;
      path = `/${elem.tagName.toLowerCase()}${idx}${path}`;
      elem = elem.parentNode;
    }

    return path;
  });

  return jq.get();
};

// A simple XPath evaluator using only standard DOM methods which can
// evaluate queries of the form /tag[index]/tag[index].
const simpleXPathPure = function(relativeRoot) {

  const getPathSegment = function(node) {
    const name = getNodeName(node);
    const pos = getNodePosition(node);
    return `${name}[${pos}]`;
  };

  const rootNode = relativeRoot;

  const getPathTo = function(node) {
    let xpath = '';
    while (node !== rootNode) {
      if (node == null) {
        throw new Error(`Called getPathTo on a node which was not a descendant of @rootNode. ${rootNode}`);
      }
      xpath = (getPathSegment(node)) + '/' + xpath;
      node = node.parentNode;
    }
    xpath = `/${xpath}`;
    xpath = xpath.replace(/\/$/, '');
    return xpath;
  };

  const jq = this.map(function() {
    const path = getPathTo(this);

    return path;
  });

  return jq.get();
};

const findChild = function(node, type, index) {
  if (!node.hasChildNodes()) {
    throw new Error("XPath error: node has no children!");
  }
  const children = node.childNodes;
  let found = 0;
  for (let child of Array.from(children)) {
    const name = getNodeName(child);
    if (name === type) {
      found += 1;
      if (found === index) {
        return child;
      }
    }
  }
  throw new Error("XPath error: wanted child not found.");
};

// Get the node name for use in generating an xpath expression.
var getNodeName = function(node) {
    const nodeName = node.nodeName.toLowerCase();
    switch (nodeName) {
      case "#text": return "text()";
      case "#comment": return "comment()";
      case "#cdata-section": return "cdata-section()";
      default: return nodeName;
    }
  };

// Get the index of the node as it appears in its parent's child list
var getNodePosition = function(node) {
  let pos = 0;
  let tmp = node;
  while (tmp) {
    if (tmp.nodeName === node.nodeName) {
      pos++;
    }
    tmp = tmp.previousSibling;
  }
  return pos;
};