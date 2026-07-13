/*
  Quantumult X auto checkin
  cron: 0 8,12,21 * * *
  MITM: not required for checkin request itself
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var cookieKey = "wjkc_checkin_cookie_";
var lastActiveKey = "wjkc_checkin_last_domain";
var checkinPath = "/api/user/sign_use";
var userinfoPath = "/api/user/userinfo";

function base64Decode(s) {
  return decodeBase64Utf8(s);
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
      var decoded = JSON.parse(base64Decode(raw.data));
      return decoded;
    }
    return raw;
  } catch (e) {
    return null;
  }
}

function request(url, cookie) {
  return $task.fetch({
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
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

function orderedDomains() {
  var last = $prefs.valueForKey(lastActiveKey);
  var arr = [];
  if (last && domains.indexOf(last) !== -1) arr.push(last);
  domains.forEach(function (d) {
    if (arr.indexOf(d) === -1) arr.push(d);
  });
  return arr;
}

function notify(title, subtitle, msg) {
  $notify(title, subtitle, msg);
}

(async () => {
  var sequence = orderedDomains();
  var lastError = "";

  for (var i = 0; i < sequence.length; i++) {
    var domain = sequence[i];
    var cookie = $prefs.valueForKey(cookieKey + domain);
    var token = $prefs.valueForKey(baseKey + domain);
    if (!cookie && token) cookie = "token=" + token;
    if (!cookie) continue;

    try {
      var c = await request("https://" + domain + checkinPath, cookie);
      var checkin = parseBody(c.body);

      if (!checkin || checkin.code !== 0) {
        lastError = c.body;
        continue;
      }

      var u = await request("https://" + domain + userinfoPath, cookie);
      var user = parseBody(u.body);
      var checkinData = checkin.data || {};
      var addGB = ((checkinData.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var totalGB = ((user && user.data && user.data.traffic ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var cont = checkinData.haveContinueSignUseData || 0;
      var extra = checkinData.extraReward ? "有" : "无";

      notify("网际快车签到成功 (" + domain + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
      $done();
      return;
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!lastError) {
    notify("网际快车签到", "未获取到登录凭证", "请先在网页登录，让模块自动抓取登录凭证");
  } else {
    notify("网际快车签到", "签到失败", lastError);
  }
  $done();
})();
