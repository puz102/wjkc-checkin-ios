/*
  Surge: token validity check
  cron: 30 8 * * *
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "wjkc_checkin_token_";
var lastActiveKey = "wjkc_checkin_last_domain";

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
      return JSON.parse($base64.decode(raw.data));
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
    var token = $persistentStore.read(baseKey + domain);
    if (!token) continue;
    foundToken = true;

    try {
      var resp = await post("https://" + domain + "/api/user/userinfo", token);
      var data = parseBody(resp.body);
      if (data && data.code === 0) {
        $notification.post("KS Token 有效", domain, "当前 token 正常，可自动签到");
        $done();
        return;
      }
    } catch (e) {
      lastError = String(e);
      continue;
    }
  }

  if (!foundToken) {
    $notification.post("KS Token 检查", "未获取到 token", "请先在网页登录");
  } else if (lastError) {
    $notification.post("KS Token 检查失败", "网络或接口异常", lastError);
  } else {
    $notification.post("KS Token 已失效", "请重新在网页登录", "登录后模块会自动抓取新 token");
  }
  $done();
})();
