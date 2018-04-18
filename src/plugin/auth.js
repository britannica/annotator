/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Public: Creates a Date object from an ISO8601 formatted date String.
//
// string - ISO8601 formatted date String.
//
// Returns Date instance.
const createDateFromISO8601 = function(string) {
  const regexp = (
    "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
    "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\\.([0-9]+))?)?" +
    "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?"
  );

  const d = string.match(new RegExp(regexp));

  let offset = 0;
  const date = new Date(d[1], 0, 1);

  if (d[3]) { date.setMonth(d[3] - 1); }
  if (d[5]) { date.setDate(d[5]); }
  if (d[7]) { date.setHours(d[7]); }
  if (d[8]) { date.setMinutes(d[8]); }
  if (d[10]) { date.setSeconds(d[10]); }
  if (d[12]) { date.setMilliseconds(Number(`0.${d[12]}`) * 1000); }

  if (d[14]) {
    let left;
    offset = (Number(d[16]) * 60) + Number(d[17]);
    offset *= (((left = d[15] === '-')) != null ? left : {1 : -1});
  }

  offset -= date.getTimezoneOffset();
  const time = (Number(date) + (offset * 60 * 1000));

  date.setTime(Number(time));
  return date;
};

const base64Decode = function(data) {
  if (typeof atob !== 'undefined' && atob !== null) {
    // Gecko and Webkit provide native code for this
    return atob(data);
  } else {
    // Adapted from MIT/BSD licensed code at http://phpjs.org/functions/base64_decode
    // version 1109.2015
    const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let i = 0;
    let ac = 0;
    const dec = "";
    const tmp_arr = [];

    if (!data) {
      return data;
    }

    data += '';

    while (i < data.length) {
      // unpack four hexets into three octets using index points in b64
      const h1 = b64.indexOf(data.charAt(i++));
      const h2 = b64.indexOf(data.charAt(i++));
      const h3 = b64.indexOf(data.charAt(i++));
      const h4 = b64.indexOf(data.charAt(i++));

      const bits = (h1 << 18) | (h2 << 12) | (h3 << 6) | h4;

      const o1 = (bits >> 16) & 0xff;
      const o2 = (bits >> 8) & 0xff;
      const o3 = bits & 0xff;

      if (h3 === 64) {
        tmp_arr[ac++] = String.fromCharCode(o1);
      } else if (h4 === 64) {
        tmp_arr[ac++] = String.fromCharCode(o1, o2);
      } else {
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
      }
    }

    return tmp_arr.join('');
  }
};

const base64UrlDecode = function(data) {
  const m = data.length % 4;
  if (m !== 0) {
    for (let i = 0, end = 4 - m, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      data += '=';
    }
  }
  data = data.replace(/-/g, '+');
  data = data.replace(/_/g, '/');
  return base64Decode(data);
};

const parseToken = function(token) {
  const [head, payload, sig] = Array.from(token.split('.'));
  return JSON.parse(base64UrlDecode(payload));
};

// Public: Supports the Store plugin by providing Authentication headers.
const Cls = (Annotator.Plugin.Auth = class Auth extends Annotator.Plugin {
  static initClass() {
    // User options that can be provided.
    this.prototype.options = {
  
      // An authentication token. Used to skip the request to the server for a
      // a token.
      token: null,
  
      // The URL on the local server to request an authentication token.
      tokenUrl: '/auth/token',
  
      // If true will try and fetch a token when the plugin is initialised.
      autoFetch: true
    };
  }

  // Public: Create a new instance of the Auth plugin.
  //
  // element - The element to bind all events to. Usually the Annotator#element.
  // options - An Object literal containing user options.
  //
  // Examples
  //
  //   plugin = new Annotator.Plugin.Auth(annotator.element, {
  //     tokenUrl: '/my/custom/path'
  //   })
  //
  // Returns instance of Auth.
  constructor(element, options) {
    super(...arguments);

    // List of functions to be executed when we have a valid token.
    this.waitingForToken = [];

    if (this.options.token) {
      this.setToken(this.options.token);
    } else {
      this.requestToken();
    }
  }

  // Public: Makes a request to the local server for an authentication token.
  //
  // Examples
  //
  //   auth.requestToken()
  //
  // Returns jqXHR object.
  requestToken() {
    this.requestInProgress = true;

    return $.ajax({
      url: this.options.tokenUrl,
      dataType: 'text',
      xhrFields: {
        withCredentials: true
 }}).done((data, status, xhr) => {
      return this.setToken(data);
 }).fail((xhr, status, err) => {
      const msg = Annotator._t("Couldn't get auth token:");
      console.error(`${msg} ${err}`, xhr);
      return Annotator.showNotification(`${msg} ${xhr.responseText}`, Annotator.Notification.ERROR);
    }).always(() => {
      return this.requestInProgress = false;
    });
  }

  // Public: Sets the @token and checks it's validity. If the token is invalid
  // requests a new one from the server.
  //
  // token - A token string.
  //
  // Examples
  //
  //   auth.setToken('eyJh...9jQ3I')
  //
  // Returns nothing.
  setToken(token) {
    this.token = token;
    // Parse the token without verifying its authenticity:
    this._unsafeToken = parseToken(token);

    if (this.haveValidToken()) {
      if (this.options.autoFetch) {
        // Set timeout to fetch new token 2 seconds before current token expiry
        this.refreshTimeout = setTimeout((() => this.requestToken()), (this.timeToExpiry() - 2) * 1000);
      }

      // Set headers field on this.element
      this.updateHeaders();

      // Run callbacks waiting for token
      return (() => {
        const result = [];
        while (this.waitingForToken.length > 0) {
          result.push(this.waitingForToken.pop()(this._unsafeToken));
        }
        return result;
      })();

    } else {
      console.warn(Annotator._t("Didn't get a valid token."));
      if (this.options.autoFetch) {
        console.warn(Annotator._t("Getting a new token in 10s."));
        return setTimeout((() => this.requestToken()), 10 * 1000);
      }
    }
  }

  // Public: Checks the validity of the current token. Note that this *does
  // not* check the authenticity of the token.
  //
  // Examples
  //
  //   auth.haveValidToken() # => Returns true if valid.
  //
  // Returns true if the token is valid.
  haveValidToken() {
    const allFields = (
      this._unsafeToken &&
      this._unsafeToken.issuedAt &&
      this._unsafeToken.ttl &&
      this._unsafeToken.consumerKey
    );

    if (allFields && (this.timeToExpiry() > 0)) {
      return true;
    } else {
      return false;
    }
  }

  // Public: Calculates the time in seconds until the current token expires.
  //
  // Returns Number of seconds until token expires.
  timeToExpiry() {
    const now = new Date().getTime() / 1000;
    const issue = createDateFromISO8601(this._unsafeToken.issuedAt).getTime() / 1000;

    const expiry = issue + this._unsafeToken.ttl;
    const timeToExpiry = expiry - now;

    if (timeToExpiry > 0) { return timeToExpiry; } else { return 0; }
  }

  // Public: Updates the headers to be sent with the Store requests. This is
  // achieved by updating the 'annotator:headers' key in the @element.data()
  // store.
  //
  // Returns nothing.
  updateHeaders() {
    const current = this.element.data('annotator:headers');
    return this.element.data('annotator:headers', $.extend(current, {
      'x-annotator-auth-token': this.token,
    }));
  }

  // Runs the provided callback if a valid token is available. Otherwise requests
  // a token until it recieves a valid one.
  //
  // callback - A callback function to call once a valid token is obtained.
  //
  // Examples
  //
  //   auth.withToken ->
  //     store.loadAnnotations()
  //
  // Returns nothing.
  withToken(callback) {
    if ((callback == null)) {
      return;
    }

    if (this.haveValidToken()) {
      return callback(this._unsafeToken);
    } else {
      this.waitingForToken.push(callback);
      if (!this.requestInProgress) {
        return this.requestToken();
      }
    }
  }
});
Cls.initClass();
