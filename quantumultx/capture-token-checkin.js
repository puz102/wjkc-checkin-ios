/*
  Quantumult X: capture token + immediate checkin
  MITM host: wj-kc.com, 84.wj-kc.com, ks.wjkc.xyz
  Pattern: ^https://(wj-kc.com|84.wj-kc.com|ks.wjkc.xyz)/api/user/login
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

function request(url, token) {
  return $task.fetch({
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "token=" + token,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
    },
    body: JSON.stringify({ data: "e30=" })
  }).then(function (resp) {
    var status = Number(resp && (resp.statusCode || resp.status));
    if (status && (status < 200 || status >= 300)) {
      throw new Error("HTTP " + status);
    }
    return resp;
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
  if (hostMatch && /\/api\/user\/login/.test(url)) {
    try {
      var setCookie = getHeader($response.headers, "set-cookie");
      var match = setCookie.match(/(?:^|[;,]\s*)token=([^;,]+)/i);
      if (match && match[1]) {
        var token = match[1].trim();
        if (token) {
          $prefs.setValueForKey(token, baseKey + hostMatch);
          $prefs.setValueForKey(hostMatch, lastActiveKey);

          try {
            var c = await request("https://" + hostMatch + "/api/user/sign_use", token);
            var checkin = parseBody(c.body);

            if (checkin && checkin.code === 0) {
              var u = await request("https://" + hostMatch + "/api/user/userinfo", token);
              var user = parseBody(u.body);
              var checkinData = checkin.data || {};
              var addGB = ((checkinData.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var totalGB = ((user && user.data ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var cont = checkinData.haveContinueSignUseData || 0;
              var extra = checkinData.extraReward ? "有" : "无";
              $notify("网际快车登录并签到成功 (" + hostMatch + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
            } else {
              $notify("网际快车登录凭证抓取成功 (" + hostMatch + ")", "登录成功，但签到失败", c.body);
            }
          } catch (e) {
            $notify("网际快车登录凭证抓取成功 (" + hostMatch + ")", "登录成功，签到异常", String(e));
          }
        }
      }
    } catch (e) {
      console.log("KS token capture failed: " + String(e));
    }
  }
  $done({});
})();
