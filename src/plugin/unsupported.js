/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Plugin that will display a notification to the user if thier browser does
// not support the Annotator.
const Cls = (Annotator.Plugin.Unsupported = class Unsupported extends Annotator.Plugin {
  static initClass() {
    // Options Object, message sets the message displayed in the browser.
    this.prototype.options =
      {message: Annotator._t("Sorry your current browser does not support the Annotator")};
  }

  // Public: Checks the Annotator.supported() method and if unsupported displays
  // @options.message in a notification.
  //
  // Returns nothing.
  pluginInit() {
    if (!Annotator.supported()) {
      return $(() => {
        // On document load display notification.
        Annotator.showNotification(this.options.message);

        // Add a class if we're in IE6. A bit of a hack but we need to be able
        // to set the notification position in the CSS.
        if ((window.XMLHttpRequest === undefined) && (ActiveXObject !== undefined)) {
          return $('html').addClass('ie6');
        }
      });
    }
  }
});
Cls.initClass();
