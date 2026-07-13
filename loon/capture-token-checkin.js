/*
  Loon: capture token + immediate checkin
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

function post(url, token) {
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
      var setCookie = getHeader($response.headers, "set-cookie");
      var match = setCookie.match(/(?:^|[;,]\s*)token=([^;,]+)/i);
      if (match && match[1]) {
        var token = match[1].trim();
        if (token) {
          $persistentStore.write(token, baseKey + hostMatch);
          $persistentStore.write(hostMatch, lastActiveKey);

          try {
            var c = await post("https://" + hostMatch + "/api/user/sign_use", token);
            var checkin = parseBody(c.body);

            if (checkin && checkin.code === 0) {
              var u = await post("https://" + hostMatch + "/api/user/userinfo", token);
              var user = parseBody(u.body);
              var checkinData = checkin.data || {};
              var addGB = ((checkinData.addTraffic || 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var totalGB = ((user && user.data ? user.data.traffic : 0) / 1024 / 1024 / 1024).toFixed(2) + " GB";
              var cont = checkinData.haveContinueSignUseData || 0;
              var extra = checkinData.extraReward ? "有" : "无";
              $notification.post("KS登录+签到成功 (" + hostMatch + ")", "+" + addGB + " | 总流量 " + totalGB, "连续签到 " + cont + " 天\n额外奖励：" + extra);
            } else {
              $notification.post("KS Token Captured (" + hostMatch + ")", "登录成功，但签到失败", c.body);
            }
          } catch (e) {
            $notification.post("KS Token Captured (" + hostMatch + ")", "登录成功，签到异常", String(e));
          }
        }
      }
    } catch (e) {
      console.log("KS token capture failed: " + String(e));
    }
  }
  $done({});
})();
