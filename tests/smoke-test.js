"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const platforms = ["surge", "loon", "shadowrocket", "quantumultx"];

function encoded(payload) {
  return JSON.stringify({
    data: Buffer.from(JSON.stringify(payload), "utf8").toString("base64"),
  });
}

function assertEncodedEmptyBody(request, platform) {
  assert.deepStrictEqual(
    JSON.parse(request.body),
    { data: "e30=" },
    `${platform} should send the API's Base64-wrapped empty payload`
  );
}

function runScript(relativePath, options = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const store = options.store || {};
  const notifications = [];
  const requests = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${relativePath} did not call $done`)),
      1500
    );

    function done(value) {
      clearTimeout(timeout);
      resolve({ store, notifications, requests, value });
    }

    function notify(title, subtitle, body) {
      notifications.push([title, subtitle, body]);
    }

    function responseFor(request) {
      requests.push(request);
      if (options.responseFor) return options.responseFor(request);
      return { status: 200, statusCode: 200, body: "{}" };
    }

    const context = {
      Promise,
      console,
      setTimeout,
      clearTimeout,
      atob: (value) => Buffer.from(value, "base64").toString("utf8"),
      $base64: {
        decode: (value) => Buffer.from(value, "base64").toString("utf8"),
      },
      $request: options.request || { url: "" },
      $response: options.response || { headers: {} },
      $done: done,
      $notify: notify,
      $notification: { post: notify },
      $persistentStore: {
        read: (key) => store[key] || null,
        write: (value, key) => {
          store[key] = value;
          return true;
        },
      },
      $prefs: {
        valueForKey: (key) => store[key] || null,
        setValueForKey: (value, key) => {
          store[key] = value;
          return true;
        },
      },
      $httpClient: {
        post: (request, callback) => {
          const response = responseFor(request);
          setTimeout(
            () => callback(null, response, response.body),
            0
          );
        },
      },
      $task: {
        fetch: (request) => Promise.resolve(responseFor(request)),
      },
    };

    try {
      vm.runInNewContext(source, context, { filename: relativePath });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function testCapture(platform) {
  const result = await runScript(`${platform}/capture-token.js`, {
    request: { url: "https://84.wj-kc.com/api/user/login" },
    response: {
      headers: {
        "set-cookie": ["theme=dark; Path=/", "token=test-token; Path=/"],
      },
    },
  });

  assert.strictEqual(
    result.store["wjkc_checkin_token_84.wj-kc.com"],
    "test-token",
    `${platform} should save a lower-case, array-form Set-Cookie token`
  );
  assert.strictEqual(
    result.store.wjkc_checkin_last_domain,
    "84.wj-kc.com",
    `${platform} should save the active domain`
  );
}

async function testHostBoundary(platform) {
  const result = await runScript(`${platform}/capture-token.js`, {
    request: { url: "https://84.wj-kc.com.evil.example/api/user/login" },
    response: { headers: { "Set-Cookie": "token=must-not-save; Path=/" } },
  });

  assert.strictEqual(
    Object.keys(result.store).length,
    0,
    `${platform} should reject look-alike hostnames`
  );
}

async function testEnhancedCapture(platform) {
  const result = await runScript(`${platform}/capture-token-checkin.js`, {
    request: { url: "https://84.wj-kc.com/api/user/login" },
    response: { headers: { "Set-Cookie": "token=test-token; Path=/" } },
    responseFor(request) {
      if (request.url.endsWith("/api/user/sign_use")) {
        return {
          status: 200,
          statusCode: 200,
          body: encoded({
            code: 0,
            data: { addTraffic: 1073741824 },
          }),
        };
      }
      return {
        status: 200,
        statusCode: 200,
        body: encoded({ code: 0, data: { traffic: 2147483648 } }),
      };
    },
  });

  assert.strictEqual(
    result.store["wjkc_checkin_token_84.wj-kc.com"],
    "test-token"
  );
  assert.ok(
    result.notifications.some(([title]) => title.includes("登录并签到成功")),
    `${platform} enhanced capture should check in immediately`
  );
}

async function testCheckin(platform) {
  const store = {
    wjkc_checkin_last_domain: "84.wj-kc.com",
    "wjkc_checkin_token_84.wj-kc.com": "test-token",
  };

  const result = await runScript(`${platform}/checkin.js`, {
    store,
    responseFor(request) {
      if (request.url.endsWith("/api/user/sign_use")) {
        return {
          status: 200,
          statusCode: 200,
          body: encoded({
            code: 0,
            data: {
              addTraffic: 1073741824,
              haveContinueSignUseData: 3,
              extraReward: true,
            },
          }),
        };
      }
      if (request.url.endsWith("/api/user/userinfo")) {
        return {
          status: 200,
          statusCode: 200,
          body: encoded({
            code: 0,
            data: { traffic: 5368709120 },
          }),
        };
      }
      throw new Error(`Unexpected request: ${request.url}`);
    },
  });

  assert.strictEqual(result.requests.length, 2);
  result.requests.forEach((request) =>
    assertEncodedEmptyBody(request, platform)
  );
  assert.ok(
    result.notifications.some(
      ([title, subtitle]) =>
        title.includes("签到成功") && subtitle.includes("+1.00 GB")
    ),
    `${platform} should report a successful check-in`
  );
}

async function testMissingTokenMessage(platform) {
  const result = await runScript(`${platform}/token-check.js`);
  assert.ok(
    result.notifications.some(([, subtitle]) =>
      subtitle.includes("未获取到登录凭证")
    ),
    `${platform} should distinguish a missing token from an expired token`
  );
}

async function testHttpFailureMessage(platform) {
  const result = await runScript(`${platform}/token-check.js`, {
    store: {
      wjkc_checkin_last_domain: "84.wj-kc.com",
      "wjkc_checkin_token_84.wj-kc.com": "test-token",
    },
    responseFor() {
      return { status: 503, statusCode: 503, body: "unavailable" };
    },
  });

  assert.ok(
    result.notifications.some(([, subtitle]) =>
      subtitle.includes("网络或接口异常")
    ),
    `${platform} should not report an HTTP failure as an expired token`
  );
}

async function testTokenCheckRequestBody(platform) {
  const result = await runScript(`${platform}/token-check.js`, {
    store: {
      wjkc_checkin_last_domain: "84.wj-kc.com",
      "wjkc_checkin_token_84.wj-kc.com": "test-token",
    },
    responseFor() {
      return {
        status: 200,
        statusCode: 200,
        body: encoded({ code: 0, data: {} }),
      };
    },
  });

  assert.strictEqual(result.requests.length, 1);
  assertEncodedEmptyBody(result.requests[0], platform);
}

(async () => {
  for (const platform of platforms) {
    await testCapture(platform);
    await testHostBoundary(platform);
    await testEnhancedCapture(platform);
    await testCheckin(platform);
    await testMissingTokenMessage(platform);
    await testHttpFailureMessage(platform);
    await testTokenCheckRequestBody(platform);
  }
  console.log(`Smoke tests passed for: ${platforms.join(", ")}`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
