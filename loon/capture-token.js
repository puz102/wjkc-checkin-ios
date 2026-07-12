/*
  Loon: capture ks token from login response
  Type: http-response
  MITM host: wj-kc.com, 84.wj-kc.com, ks.wjkc.xyz
  Match: ^https://(wj-kc.com|84.wj-kc.com|ks.wjkc.xyz)/api/user/login
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var lastActiveKey = "wjkc_checkin_last_domain";
var url = $request.url || "";
var hostMatch = null;

domains.forEach(function (d) {
  if (!hostMatch && url.indexOf("https://" + d + "/") === 0) {
    hostMatch = d;
  }
});

function getHeader(headers, name) {
  var target = name.toLowerCase();
  var value = "";
  Object.keys(headers || {}).some(function (key) {
    if (key.toLowerCase() === target) {
      value = headers[key];
      return true;
    }
    return false;
  });
  if (Array.isArray(value)) return value.join("; ");
  return value == null ? "" : String(value);
}

if (hostMatch && /\/api\/user\/login/.test(url)) {
  try {
    var setCookie = getHeader($response.headers, "set-cookie");
    var match = setCookie.match(/(?:^|[;,]\s*)token=([^;,]+)/i);
    if (match && match[1]) {
      var token = match[1].trim();
      if (token) {
        $persistentStore.write(token, baseKey + hostMatch);
        $persistentStore.write(hostMatch, lastActiveKey);
        $notification.post("KS Token Captured", hostMatch, "Token stored for auto checkin.");
      }
    }
  } catch (e) {
    console.log("KS token capture failed: " + String(e));
  }
}

$done({});
