/*
  Shadowrocket: capture token + immediate checkin
  Type: http-response
  MITM host: wj-kc.com, 84.wj-kc.com, ks.wjkc.xyz
  Match: ^https://(wj-kc.com|84.wj-kc.com|ks.wjkc.xyz)/api/user/login
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "YOUR_TOKEN_STORAGE_KEY";
var lastActiveKey = "YOUR_LAST_ACTIVE_DOMAIN_KEY";
var url = $request.url || "";
var hostMatch = null;

domains.forEach(function (d) {
  if (!hostMatch && url.indexOf(d) !== -1) {
    hostMatch = d;
  }
});

function req(url, token) {
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

(async () => {
  if (hostMatch && /\/api\/user\/login/.test(url)) {
    try {
      var setCookie = ($response.headers || {})["Set-Cookie"] || "";
      var match = setCookie.match(/(?:^|;\s*)token=([^;]+)/i);
      if (match && match[1]) {
        var token = match[1].trim();
        if (token) {
          $persistentStore.write(token, baseKey + hostMatch);
          $persistentStore.write(hostMatch, lastActiveKey);

          try {
            var c = await req("https://" + hostMatch + "/api/user/sign_use", token);
            var u = await req("https://" + hostMatch + "/api/user/userinfo", token);
            var checkin = parseBody(c.body);
            var user = parseBody(u.body);

            if (checkin && checkin.code === 0) {
              var addGB = ((checkin.data.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var totalGB = ((user && user.data ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var cont = checkin.data.haveContinueSignUseData || 0;
              var extra = checkin.data.extraReward ? "有" : "无";
              $notify("KS登录+签到成功 (" + hostMatch + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
            } else {
              $notify("KS Token Captured (" + hostMatch + ")", "登录成功，但签到失败", c.body);
            }
          } catch (e) {
            $notify("KS Token Captured (" + hostMatch + ")", "登录成功，签到异常", String(e));
          }
        }
      }
    } catch (e) {}
  }
  $done({});
})();
