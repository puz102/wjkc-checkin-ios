/*
  Quantumult X auto checkin
  cron: 0 8,12,21 * * *
  MITM: not required for checkin request itself
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "YOUR_TOKEN_STORAGE_KEY";
var lastActiveKey = "YOUR_LAST_ACTIVE_DOMAIN_KEY";
var checkinPath = "/api/user/sign_use";
var userinfoPath = "/api/user/userinfo";

function base64Decode(s) {
  return $base64.decode(s);
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

function request(url, token) {
  return new Promise(function (resolve, reject) {
    $task.fetch({
      url: url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": "token=" + token,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      },
      body: "{}"
    }, function (err, resp) {
      if (err) return reject(err);
      resolve(resp);
    });
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
    var token = $prefs.valueForKey(baseKey + domain);
    if (!token) continue;

    try {
      var c = await request("https://" + domain + checkinPath, token);
      var u = await request("https://" + domain + userinfoPath, token);
      var checkin = parseBody(c.body);
      var user = parseBody(u.body);

      if (!checkin || checkin.code !== 0) {
        lastError = c.body;
        continue;
      }

      var addGB = ((checkin.data.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var totalGB = ((user && user.data && user.data.traffic ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
      var cont = (checkin.data.haveContinueSignUseData || 0);
      var extra = checkin.data.extraReward ? "有" : "无";

      notify("KS签到成功 (" + domain + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
      $done();
      return;
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!lastError) {
    notify("KS签到", "未获取到token", "请先在网页登录，让模块自动抓取token");
  } else {
    notify("KS签到", "签到失败", lastError);
  }
  $done();
})();
