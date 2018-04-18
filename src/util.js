/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// I18N
let gettext = null;

if (typeof Gettext !== 'undefined' && Gettext !== null) {
  const _gettext = new Gettext({domain: "annotator"});
  gettext = msgid => _gettext.gettext(msgid);
} else {
  gettext = msgid => msgid;
}

const _t = msgid => gettext(msgid);

if (!__guard__(typeof jQuery !== 'undefined' && jQuery !== null ? jQuery.fn : undefined, x => x.jquery)) {
  console.error(_t("Annotator requires jQuery: have you included lib/vendor/jquery.js?"));
}

if (!JSON || !JSON.parse || !JSON.stringify) {
  console.error(_t("Annotator requires a JSON implementation: have you included lib/vendor/json2.js?"));
}

const $ = jQuery;

const Util = {};

// Public: Flatten a nested array structure
//
// Returns an array
Util.flatten = function(array) {
  var flatten = function(ary) {
    let flat = [];

    for (let el of Array.from(ary)) {
      flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
    }

    return flat;
  };

  return flatten(array);
};


// Public: decides whether node A is an ancestor of node B.
//
// This function purposefully ignores the native browser function for this,
// because it acts weird in PhantomJS.
// Issue: https://github.com/ariya/phantomjs/issues/11479
Util.contains = function(parent, child) {
  let node = child;
  while (node != null) {
    if (node === parent) { return true; }
    node = node.parentNode;
  }
  return false;
};

// Public: Finds all text nodes within the elements in the current collection.
//
// Returns a new jQuery collection of text nodes.
Util.getTextNodes = function(jq) {
  var getTextNodes = function(node) {
    if (node && (node.nodeType !== Node.TEXT_NODE)) {
      const nodes = [];

      // If not a comment then traverse children collecting text nodes.
      // We traverse the child nodes manually rather than using the .childNodes
      // property because IE9 does not update the .childNodes property after
      // .splitText() is called on a child text node.
      if (node.nodeType !== Node.COMMENT_NODE) {
        // Start at the last child and walk backwards through siblings.
        node = node.lastChild;
        while (node) {
          nodes.push(getTextNodes(node));
          node = node.previousSibling;
        }
      }

      // Finally reverse the array so that nodes are in the correct order.
      return nodes.reverse();
    } else {
      return node;
    }
  };

  return jq.map(function() { return Util.flatten(getTextNodes(this)); });
};

// Public: determine the last text node inside or before the given node
Util.getLastTextNodeUpTo = function(n) {
  switch (n.nodeType) {
    case Node.TEXT_NODE:
      return n; // We have found our text node.
      break;
    case Node.ELEMENT_NODE:
      // This is an element, we need to dig in
      if (n.lastChild != null) { // Does it have children at all?
        const result = Util.getLastTextNodeUpTo(n.lastChild);
        if (result != null) { return result; }        
      }
      break;
    default:
  }
      // Not a text node, and not an element node.
  // Could not find a text node in current node, go backwards
  n = n.previousSibling;
  if (n != null) {
    return Util.getLastTextNodeUpTo(n);
  } else {
    return null;
  }
};

// Public: determine the first text node in or after the given jQuery node.
Util.getFirstTextNodeNotBefore = function(n) {
  switch (n.nodeType) {
    case Node.TEXT_NODE:
      return n; // We have found our text node.
      break;
    case Node.ELEMENT_NODE:
      // This is an element, we need to dig in
      if (n.firstChild != null) { // Does it have children at all?
        const result = Util.getFirstTextNodeNotBefore(n.firstChild);
        if (result != null) { return result; }
      }
      break;
    default:
  }
      // Not a text or an element node.
  // Could not find a text node in current node, go forward
  n = n.nextSibling;
  if (n != null) {
    return Util.getFirstTextNodeNotBefore(n);
  } else {
    return null;
  }
};

// Public: read out the text value of a range using the selection API
//
// This method selects the specified range, and asks for the string
// value of the selection. What this returns is very close to what the user
// actually sees.
Util.readRangeViaSelection = function(range) {
  const sel = Util.getGlobal().getSelection(); // Get the browser selection object
  sel.removeAllRanges();                 // clear the selection
  sel.addRange(range.toRange());          // Select the range
  return sel.toString();                        // Read out the selection
};

Util.xpathFromNode = function(el, relativeRoot) {
  let result;
  try {
    result = simpleXPathJQuery.call(el, relativeRoot);
  } catch (exception) {
    console.log("jQuery-based XPath construction failed! Falling back to manual.");
    result = simpleXPathPure.call(el, relativeRoot);
  }
  return result;
};

Util.nodeFromXPath = function(xp, root) {
  const steps = xp.substring(1).split("/");
  let node = root;
  for (let step of Array.from(steps)) {
    let [name, idx] = Array.from(step.split("["));
    idx = (idx != null) ? parseInt((idx != null ? idx.split("]") : undefined)[0]) : 1;
    node = findChild(node, name.toLowerCase(), idx);
  }

  return node;
};

Util.escape = html =>
  html
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
;

Util.uuid = (function() { let counter = 0; return () => counter++; })();

Util.getGlobal = () => (function() { return this; })();

// Return the maximum z-index of any element in $elements (a jQuery collection).
Util.maxZIndex = function($elements) {
  const all = Array.from($elements).map((el) =>
          $(el).css('position') === 'static' ?
            -1
          :
            // Use parseFloat since we may get scientific notation for large
            // values.
            parseFloat($(el).css('z-index')) || -1);
  return Math.max.apply(Math, all);
};

Util.mousePosition = function(e, offsetEl) {
  // If the offset element is not a positioning root use its offset parent
  let needle;
  if ((needle = $(offsetEl).css('position'), !['absolute', 'fixed', 'relative'].includes(needle))) {
    offsetEl = $(offsetEl).offsetParent()[0];
  }
  const offset = $(offsetEl).offset();
  return {
    top:  e.pageY - offset.top,
    left: e.pageX - offset.left
  };
};

// Checks to see if an event parameter is provided and contains the prevent
// default method. If it does it calls it.
//
// This is useful for methods that can be optionally used as callbacks
// where the existance of the parameter must be checked before calling.
Util.preventEventDefault = event => __guardMethod__(event, 'preventDefault', o => o.preventDefault());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}