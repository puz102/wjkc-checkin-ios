/*
  Shadowrocket: token validity check
  cron: 30 8 * * *
*/

var domains = ["wj-kc.com", "84.wj-kc.com", "ks.wjkc.xyz"];
var baseKey = "YOUR_TOKEN_STORAGE_KEY";
var lastActiveKey = "YOUR_LAST_ACTIVE_DOMAIN_KEY";

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
  var last = $persistentStore.read(lastActiveKey);
  var ordered = [];
  if (last && domains.indexOf(last) !== -1) ordered.push(last);
  domains.forEach(function (d) {
    if (ordered.indexOf(d) === -1) ordered.push(d);
  });

  for (var i = 0; i < ordered.length; i++) {
    var domain = ordered[i];
    var token = $persistentStore.read(baseKey + domain);
    if (!token) continue;

    try {
      var resp = await req("https://" + domain + "/api/user/userinfo", token);
      var data = parseBody(resp.body);
      if (data && data.code === 0) {
        $notify("KS Token 有效", domain, "当前 token 正常，可自动签到");
        $done();
        return;
      }
    } catch (e) {
      continue;
    }
  }

  $notify("KS Token 已失效", "请重新在网页登录", "登录后模块会自动抓取新 token");
  $done();
})();
