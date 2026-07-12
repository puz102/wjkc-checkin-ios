/*
  Quantumult X: token validity check
  cron: 30 8 * * *
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var lastActiveKey = "wjkc_checkin_last_domain";

function request(url, token) {
  return $task.fetch({
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "token=" + token,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
    },
    body: "{}"
  }).then(function (resp) {
    var status = Number(resp && (resp.statusCode || resp.status));
    if (status && (status < 200 || status >= 300)) {
      throw new Error("HTTP " + status);
    }
    return resp;
  });
}

function parseBody(body) {
  try {
    var raw = JSON.parse(body);
    if (raw && typeof raw.data === "string") {
      return JSON.parse($base64.decode(raw.data));
    }
    return raw;
  } catch (e) {
    return null;
  }
}

(async () => {
  var last = $prefs.valueForKey(lastActiveKey);
  var ordered = [];
  if (last && domains.indexOf(last) !== -1) ordered.push(last);
  domains.forEach(function (d) {
    if (ordered.indexOf(d) === -1) ordered.push(d);
  });

  var foundToken = false;
  var lastError = "";

  for (var i = 0; i < ordered.length; i++) {
    var domain = ordered[i];
    var token = $prefs.valueForKey(baseKey + domain);
    if (!token) continue;
    foundToken = true;

    try {
      var resp = await request("https://" + domain + "/api/user/userinfo", token);
      var data = parseBody(resp.body);
      if (data && data.code === 0) {
        $notify("KS Token 有效", domain, "当前 token 正常，可自动签到");
        $done();
        return;
      }
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!foundToken) {
    $notify("KS Token 检查", "未获取到 token", "请先在网页登录");
  } else if (lastError) {
    $notify("KS Token 检查失败", "网络或接口异常", lastError);
  } else {
    $notify("KS Token 已失效", "请重新在网页登录", "登录后模块会自动抓取新 token");
  }
  $done();
})();
