/*
  Shadowrocket auto checkin
  cron: 0 8,12,21 * * *
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var lastActiveKey = "wjkc_checkin_last_domain";
var checkinPath = "/api/user/sign_use";
var userinfoPath = "/api/user/userinfo";

function parseBody(body) {
  try {
    var raw = JSON.parse(body);
    if (raw && typeof raw.data === "string") {
      return JSON.parse(atob(raw.data));
    }
    return raw;
  } catch (e) {
    return null;
  }
}

function req(url, token) {
  return new Promise(function (resolve, reject) {
    $httpClient.post({
      url: url,
      headers: {
        "Content-Type": "application/json",
        "Cookie": "token=" + token,
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

function orderedDomains() {
  var last = $persistentStore.read(lastActiveKey);
  var arr = [];
  if (last && domains.indexOf(last) !== -1) arr.push(last);
  domains.forEach(function (d) {
    if (arr.indexOf(d) === -1) arr.push(d);
  });
  return arr;
}

(async () => {
  var sequence = orderedDomains();
  var lastError = "";

  for (var i = 0; i < sequence.length; i++) {
    var domain = sequence[i];
    var token = $persistentStore.read(baseKey + domain);
    if (!token) continue;

    try {
      var c = await req("https://" + domain + checkinPath, token);
      var checkin = parseBody(c.body);

      if (!checkin || checkin.code !== 0) {
        lastError = c.body;
        continue;
      }

      var u = await req("https://" + domain + userinfoPath, token);
      var user = parseBody(u.body);
      var checkinData = checkin.data || {};
      var addGB = ((checkinData.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var totalGB = ((user && user.data ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var cont = checkinData.haveContinueSignUseData || 0;
      var extra = checkinData.extraReward ? "有" : "无";

      $notification.post("KS签到成功 (" + domain + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
      $done();
      return;
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!lastError) {
    $notification.post("KS签到", "未获取到token", "请先在网页登录，让模块自动抓取token");
  } else {
    $notification.post("KS签到", "签到失败", lastError);
  }
  $done();
})();
