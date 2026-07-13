/*
  Loon: capture login credentials from the login response and the
  browser's first authenticated userinfo request.
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var cookieKey = "wjkc_checkin_cookie_";
var lastActiveKey = "wjkc_checkin_last_domain";
var url = ($request && $request.url) || "";
var hostMatch = null;

domains.forEach(function (d) {
  if (!hostMatch && url.indexOf("https://" + d + "/") === 0) hostMatch = d;
});

function getHeader(headers, name) {
  var target = name.toLowerCase();
  var value = "";
  Object.keys(headers || {}).some(function (key) {
    if (key.toLowerCase() === target) { value = headers[key]; return true; }
    return false;
  });
  if (Array.isArray(value)) return value.join("; ");
  return value == null ? "" : String(value);
}

function tokenFromCookie(cookie, isSetCookie) {
  var pattern = isSetCookie
    ? /(?:^|[;,]\s*)token=([^;,]+)/i
    : /(?:^|;\s*)token=([^;]+)/i;
  var match = String(cookie || "").match(pattern);
  return match && match[1] ? match[1].trim() : "";
}

function save(token, cookie, calibrated) {
  if (!token || !cookie) return;
  var previousCookie = $persistentStore.read(cookieKey + hostMatch);
  $persistentStore.write(token, baseKey + hostMatch);
        $persistentStore.write(cookie, cookieKey + hostMatch);
        $persistentStore.write(hostMatch, lastActiveKey);
  if (!calibrated || previousCookie !== cookie) {
    $notification.post(calibrated ? "网际快车登录凭证校准成功" : "网际快车登录凭证抓取成功", hostMatch,
      calibrated ? "已保存浏览器实际使用的完整登录凭证。" : "登录凭证已保存，可用于自动签到。");
  }
}

if (hostMatch) {
  try {
    var requestCookie = getHeader(($request && $request.headers) || {}, "cookie");
    var requestToken = tokenFromCookie(requestCookie, false);

    if (/\/api\/user\/userinfo(?:[/?]|$)/.test(url) && requestToken) {
      save(requestToken, requestCookie, true);
    } else if (/\/api\/user\/login(?:[/?]|$)/.test(url) && typeof $response !== "undefined") {
      var setCookie = getHeader($response.headers || {}, "set-cookie");
      var responseToken = tokenFromCookie(setCookie, true);
      if (responseToken) save(responseToken, "token=" + responseToken, false);
    }
  } catch (e) {
    console.log("Credential capture failed: " + String(e));
  }
}

$done({});
