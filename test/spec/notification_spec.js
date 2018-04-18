/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Annotator.Notification', function() {
  let notification = null;

  beforeEach(() => notification = new Annotator.Notification());

  afterEach(() => notification.element.remove());

  it('should be appended to the document.body', () => assert.equal(notification.element[0].parentNode, document.body));

  describe('.show()', function() {
    const message = 'This is a notification message';

    beforeEach(() => notification.show(message));

    it('should have a class named "annotator-notice-show"', () => assert.isTrue(notification.element.hasClass('annotator-notice-show')));

    it('should have a class named "annotator-notice-info"', () => assert.isTrue(notification.element.hasClass('annotator-notice-info')));

    return it('should update the notification message', () => assert.equal(notification.element.html(), message));
  });

  return describe('.hide()', function() {
    beforeEach(function() {
      notification.show();
      return notification.hide();
    });

    it('should not have a class named "annotator-notice-show"', () => assert.isFalse(notification.element.hasClass('annotator-notice-show')));

    return it('should not have a class named "annotator-notice-info"', () => assert.isFalse(notification.element.hasClass('annotator-notice-info')));
  });
});
