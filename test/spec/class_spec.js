/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class DelegatedExample extends Delegator {
  static initClass() {
    this.prototype.events = {
      'div click': 'pushA',
      'baz': 'pushB',
      'li click': 'pushC'
    };
  
    this.prototype.options = {
      foo: "bar",
      bar(a) { return a; }
    };
  }

  constructor(elem) {
    super(...arguments);
    this.returns = [];
  }

  pushA() { return this.returns.push("A"); }
  pushB() { return this.returns.push("B"); }
  pushC() { return this.returns.push("C"); }
}
DelegatedExample.initClass();

describe('Delegator', function() {
  let delegator = null;
  let $fix = null;

  beforeEach(function() {
    addFixture('delegator');

    delegator = new DelegatedExample(fix());
    return $fix = $(fix());
  });

  afterEach(() => clearFixtures());

  describe("options", function() {
    it("should provide access to an options object", function() {
      assert.equal(delegator.options.foo, "bar");
      return delegator.options.bar = a => `<${a}>`;
    });

    return it("should be unique to an instance", () => assert.equal(delegator.options.bar("hello"), "hello"));
  });

  it("automatically binds events described in its events property", function() {
    $fix.find('p').click();
    return assert.deepEqual(delegator.returns, ['A']);
  });

  it("will bind events in its events property to its root element if no selector is specified", function() {
    $fix.trigger('baz');
    return assert.deepEqual(delegator.returns, ['B']);
  });

  it("uses event delegation to bind the events", function() {
    $fix.find('ol').append("<li>Hi there, I'm new round here.</li>");
    $fix.find('li').click();

    return assert.deepEqual(delegator.returns, ['C', 'A', 'C', 'A']);
  });

  describe("removeEvents", () =>
    it("should remove all events previously bound by addEvents", function() {
      delegator.removeEvents();

      $fix.find('ol').append("<li>Hi there, I'm new round here.</li>");
      $fix.find('li').click();
      $fix.trigger('baz');

      return assert.deepEqual(delegator.returns, []);
    })
  );

  describe("on", () =>
    it("should be an alias of Delegator#subscribe()", () => assert.strictEqual(delegator.on, delegator.subscribe))
  );

  describe("subscribe", function() {
    it("should bind an event to the Delegator#element", function() {
      const callback = sinon.spy();
      delegator.subscribe('custom', callback);

      delegator.element.trigger('custom');
      return assert(callback.called);
    });

    it("should remove the event object from the parameters passed to the callback", function() {
      const callback = sinon.spy();
      delegator.subscribe('custom', callback);

      delegator.element.trigger('custom', ['first', 'second', 'third']);
      return assert(callback.calledWith('first', 'second', 'third'));
    });

    it("should ensure the bound function is unbindable", function() {
      const callback = sinon.spy();

      delegator.subscribe('custom', callback);
      delegator.unsubscribe('custom', callback);
      delegator.publish('custom');

      return assert.isFalse(callback.called);
    });

    return it("should not bubble custom events", function() {
      const callback = sinon.spy();
      $('body').bind('custom', callback);

      delegator.element = $('<div />').appendTo('body');
      delegator.publish('custom');

      return assert.isFalse(callback.called);
    });
  });

  describe("unsubscribe", () =>
    it("should unbind an event from the Delegator#element", function() {
      let callback = sinon.spy();

      delegator.element.bind('custom', callback);
      delegator.unsubscribe('custom', callback);
      delegator.element.trigger('custom');

      assert.isFalse(callback.called);

      callback = sinon.spy();

      delegator.element.bind('custom', callback);
      delegator.unsubscribe('custom');
      delegator.element.trigger('custom');

      return assert.isFalse(callback.called);
    })
  );

  describe("publish", () =>
    it("should trigger an event on the Delegator#element", function() {
      const callback = sinon.spy();
      delegator.element.bind('custom', callback);

      delegator.publish('custom');
      return assert(callback.called);
    })
  );

  return describe("Delegator._isCustomEvent", function() {
    const events = [
      ['click', false],
      ['mouseover', false],
      ['mousedown', false],
      ['submit', false],
      ['load', false],
      ['click.namespaced', false],
      ['save', true],
      ['cancel', true],
      ['update', true]
    ];

    return it("should return true if the string passed is a custom event", () =>
      (() => {
        const result1 = [];
        while (events.length) {
          const [event, result] = Array.from(events.shift());
          result1.push(assert.equal(Delegator._isCustomEvent(event), result));
        }
        return result1;
      })()
    );
  });
});
