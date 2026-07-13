/*
  Shadowrocket: token validity check
  cron: 30 8 * * *
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var cookieKey = "wjkc_checkin_cookie_";
var lastActiveKey = "wjkc_checkin_last_domain";

function req(url, cookie) {
  return new Promise(function (resolve, reject) {
    $httpClient.post({
      url: url,
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      },
      body: JSON.stringify({ data: "e30=" })
    }, function (err, resp, body) {
      if (err) return reject(err);
      var status = Number(resp && (resp.status || resp.statusCode));
      if (status && (status < 200 || status >= 300)) {
        return reject(new Error("HTTP " + status));
      }
      resolve({ resp: resp, body: body });
    });
  });
}

function decodeBase64Utf8(input) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var clean = String(input || "").replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/]/g, "");
  var bytes = [];
  var buffer = 0;
  var bits = 0;

  for (var i = 0; i < clean.length; i++) {
    var value = chars.indexOf(clean.charAt(i));
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
      buffer = bits ? buffer & ((1 << bits) - 1) : 0;
    }
  }

  var escaped = "";
  var binary = "";
  for (var j = 0; j < bytes.length; j++) {
    var hex = bytes[j].toString(16);
    escaped += "%" + (hex.length < 2 ? "0" : "") + hex;
    binary += String.fromCharCode(bytes[j]);
  }
  try { return decodeURIComponent(escaped); } catch (e) { return binary; }
}

function parseBody(body) {
  try {
    var raw = JSON.parse(body);
    if (raw && typeof raw.data === "string") {
      return JSON.parse(decodeBase64Utf8(raw.data));
    }
    return raw;
  } catch (e) {
    return null;
  }
}

(async () => {
  var last = $persistentStore.read(lastActiveKey);
  var ordered = [];
  if (last && domains.indexOf(last) !== -1) ordered.push(last);
  domains.forEach(function (d) {
    if (ordered.indexOf(d) === -1) ordered.push(d);
  });

  var foundToken = false;
  var lastError = "";

  for (var i = 0; i < ordered.length; i++) {
    var domain = ordered[i];
    var cookie = $persistentStore.read(cookieKey + domain);
    var token = $persistentStore.read(baseKey + domain);
    if (!cookie && token) cookie = "token=" + token;
    if (!cookie) continue;
    foundToken = true;

    try {
      var resp = await req("https://" + domain + "/api/user/userinfo", cookie);
      var data = parseBody(resp.body);
      if (data && data.code === 0) {
        $notification.post("网际快车登录凭证有效", domain, "当前登录凭证正常，可自动签到");
        $done();
        return;
      }
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!foundToken) {
    $notification.post("网际快车登录凭证检查", "未获取到登录凭证", "请先在网页登录");
  } else if (lastError) {
    $notification.post("网际快车登录凭证检查失败", "网络或接口异常", lastError);
  } else {
    $notification.post("网际快车登录凭证已失效", "请重新在网页登录", "登录后模块会自动抓取新的登录凭证");
  }
  $done();
})();
