/*
  Shadowrocket: capture ks token from login response
  Type: http-response
  MITM host: YOUR_PRIMARY_DOMAIN, YOUR_BACKUP_DOMAIN, YOUR_THIRD_DOMAIN
  Match: ^https://(YOUR_PRIMARY_DOMAIN|YOUR_BACKUP_DOMAIN|YOUR_THIRD_DOMAIN)/api/user/login
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

if (hostMatch && /\/api\/user\/login/.test(url)) {
  try {
    var setCookie = ($response.headers || {})["Set-Cookie"] || "";
    var match = setCookie.match(/(?:^|;\s*)token=([^;]+)/i);
    if (match && match[1]) {
      var token = match[1].trim();
      if (token) {
        $persistentStore.write(token, baseKey + hostMatch);
        $persistentStore.write(hostMatch, lastActiveKey);
        $notify("KS Token Captured", hostMatch, "Token stored for auto checkin.");
      }
    }
  } catch (e) {}
}

$done({});
