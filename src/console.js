/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Stub the console when not available so that everything still works.

let fn;
const functions = [
  "log", "debug", "info", "warn", "exception", "assert", "dir", "dirxml",
  "trace", "group", "groupEnd", "groupCollapsed", "time", "timeEnd", "profile",
  "profileEnd", "count", "clear", "table", "error", "notifyFirebug", "firebug",
  "userObjects"
];

if (typeof console !== 'undefined' && console !== null) {
  // Opera's console doesn't have a group function as of 2010-07-01
  if ((console.group == null)) {
    console.group = name => console.log("GROUP: ", name);
  }

  // Webkit's developer console has yet to implement groupCollapsed as of 2010-07-01
  if ((console.groupCollapsed == null)) {
    console.groupCollapsed = console.group;
  }

  // Stub out any remaining functions
  for (fn of Array.from(functions)) {
    if ((console[fn] == null)) {
      console[fn] = () => console.log(_t("Not implemented:") + ` console.${name}`);
    }
  }
} else {
  this.console = {};

  for (fn of Array.from(functions)) {
    this.console[fn] = function() {};
  }

  this.console['error'] = (...args) => alert(`ERROR: ${args.join(', ')}`);

  this.console['warn'] = (...args) => alert(`WARNING: ${args.join(', ')}`);
}
