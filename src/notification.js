/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
var Annotator = Annotator || {};

// Public: A simple notification system that can be used to display information,
// warnings and errors to the user. Display of notifications are controlled
// cmpletely by CSS by adding/removing the @options.classes.show class. This
// allows styling/animation using CSS rather than hardcoding styles.
const Cls = (Annotator.Notification = class Notification extends Delegator {
  static initClass() {
  
    // Sets events to be bound to the @element.
    this.prototype.events =
      {"click": "hide"};
  
    // Default options.
    this.prototype.options = {
      html: "<div class='annotator-notice'></div>",
      classes: {
        show:    "annotator-notice-show",
        info:    "annotator-notice-info",
        success: "annotator-notice-success",
        error:   "annotator-notice-error"
      }
    };
  }

  // Public: Creates an instance of  Notification and appends it to the
  // document body.
  //
  // options - The following options can be provided.
  //           classes - A Object literal of classes used to determine state.
  //           html    - An HTML string used to create the notification.
  //
  // Examples
  //
  //   # Displays a notification with the text "Hello World"
  //   notification = new Annotator.Notification
  //   notification.show("Hello World")
  //
  // Returns
  constructor(options) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    super($(this.options.html).appendTo(document.body)[0], options);
  }

  // Public: Displays the annotation with message and optional status. The
  // message will hide itself after 5 seconds or if the user clicks on it.
  //
  // message - A message String to display (HTML will be escaped).
  // status  - A status constant. This will apply a class to the element for
  //           styling. (default: Annotator.Notification.INFO)
  //
  // Examples
  //
  //   # Displays a notification with the text "Hello World"
  //   notification.show("Hello World")
  //
  //   # Displays a notification with the text "An error has occurred"
  //   notification.show("An error has occurred", Annotator.Notification.ERROR)
  //
  // Returns itself.
  show(message, status) {
    if (status == null) { status = Annotator.Notification.INFO; }
    this.currentStatus = status;
    $(this.element)
      .addClass(this.options.classes.show)
      .addClass(this.options.classes[this.currentStatus])
      .html(Util.escape(message || ""));

    setTimeout(this.hide, 5000);
    return this;
  }

  // Public: Hides the notification.
  //
  // Examples
  //
  //   # Hides the notification.
  //   notification.hide()
  //
  // Returns itself.
  hide() {
    if (this.currentStatus == null) { this.currentStatus = Annotator.Notification.INFO; }
    $(this.element)
      .removeClass(this.options.classes.show)
      .removeClass(this.options.classes[this.currentStatus]);
    return this;
  }
});
Cls.initClass();

// Constants for controlling the display of the notification. Each constant
// adds a different class to the Notification#element.
Annotator.Notification.INFO    = 'info';
Annotator.Notification.SUCCESS = 'success';
Annotator.Notification.ERROR   = 'error';

// Attach notification methods to the Annotation object on document ready.
$(function() {
  const notification = new Annotator.Notification;

  Annotator.showNotification = notification.show;
  return Annotator.hideNotification = notification.hide;
});
