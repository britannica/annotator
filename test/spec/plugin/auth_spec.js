/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Date.prototype.toISO8601String = DateToISO8601String;

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const base64Encode = function(data) {
  if (typeof btoa !== 'undefined' && btoa !== null) {
    // Gecko and Webkit provide native code for this
    return btoa(data);
  } else {
    // Adapted from MIT/BSD licensed code at http://phpjs.org/functions/base64_encode
    // version 1109.2015
    let i = 0;
    let ac = 0;
    let enc = "";
    const tmp_arr = [];

    if (!data) {
      return data;
    }

    data += '';

    while (i < data.length) {
      // pack three octets into four hexets
      const o1 = data.charCodeAt(i++);
      const o2 = data.charCodeAt(i++);
      const o3 = data.charCodeAt(i++);

      const bits = (o1 << 16) | (o2 << 8) | o3;

      const h1 = (bits >> 18) & 0x3f;
      const h2 = (bits >> 12) & 0x3f;
      const h3 = (bits >> 6) & 0x3f;
      const h4 = bits & 0x3f;

      // use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = B64.charAt(h1) + B64.charAt(h2) + B64.charAt(h3) + B64.charAt(h4);
    }

    enc = tmp_arr.join('');

    const r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
  }
};

const base64UrlEncode = function(data) {
  data = base64Encode(data);
  const chop = data.indexOf('=');
  if (chop !== -1) { data = data.slice(0, chop); }
  data = data.replace(/\+/g, '-');
  data = data.replace(/\//g, '_');
  return data;
};

const makeToken = function() {
  const rawToken = {
    consumerKey: "key",
    issuedAt: new Date().toISO8601String(),
    ttl: 300,
    userId: "testUser"
  };
  return {
    rawToken,
    encodedToken: `header.${base64UrlEncode(JSON.stringify(rawToken))}.signature`
  };
};

describe('Annotator.Plugin.Auth', function() {
  let mock = null;
  let rawToken = null;
  let encodedToken = null;

  const mockAuth = function(options) {
    const el = $('<div></div>')[0];
    const a = new Annotator.Plugin.Auth(el, options);

    return {
      elem: el,
      auth: a
    };
  };

  beforeEach(function() {
    ({rawToken, encodedToken} = makeToken());
    return mock = mockAuth({token: encodedToken, autoFetch: false});
  });

  it("uses token supplied in options by default", () => assert.equal(mock.auth.token, encodedToken));

  xit("makes an ajax request to tokenUrl to retrieve token otherwise");

  it("sets annotator:headers data on its element with token data", function() {
    const data = $(mock.elem).data('annotator:headers');
    assert.isNotNull(data);
    return assert.equal(data['x-annotator-auth-token'], encodedToken);
  });

  it("should call callbacks given to #withToken immediately if it has a valid token", function() {
    const callback = sinon.spy();
    mock.auth.withToken(callback);
    return assert.isTrue(callback.calledWith(rawToken));
  });

  xit("should call callbacks given to #withToken after retrieving a token");

  return describe("#haveValidToken", function() {
    it("returns true when the current token is valid", () => assert.isTrue(mock.auth.haveValidToken()));

    it("returns false when the current token is missing a consumerKey", function() {
      delete mock.auth._unsafeToken.consumerKey;
      return assert.isFalse(mock.auth.haveValidToken());
    });

    it("returns false when the current token is missing an issuedAt", function() {
      delete mock.auth._unsafeToken.issuedAt;
      return assert.isFalse(mock.auth.haveValidToken());
    });

    it("returns false when the current token is missing a ttl", function() {
      delete mock.auth._unsafeToken.ttl;
      return assert.isFalse(mock.auth.haveValidToken());
    });

    return it("returns false when the current token expires in the past", function() {
      mock.auth._unsafeToken.ttl = 0;
      assert.isFalse(mock.auth.haveValidToken());
      mock.auth._unsafeToken.ttl = 86400;
      mock.auth._unsafeToken.issuedAt = "1970-01-01T00:00";
      return assert.isFalse(mock.auth.haveValidToken());
    });
  });
});
