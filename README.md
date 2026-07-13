# KS 网际快车自动签到

适用于 Shadowrocket、Surge、Quantumult X 和 Loon 的自动签到脚本。

## 功能

- 登录后从响应的 `Set-Cookie` 自动获取 token
- token 仅保存在代理 App 的本地持久化存储中
- 每天 08:00、12:00、21:00 自动签到
- 每天 08:30 检查 token 是否有效
- 记录最近使用的域名，并在请求失败时尝试其他已保存 token 的域名
- 提供普通版和登录后立即签到的增强版

支持域名：

- `wj-kc.com`
- `84.wj-kc.com`
- `ks.wjkc.xyz`

## 选择版本

请只导入一种版本，不要同时启用普通版和增强版。

- **普通版**：登录时只保存 token，等待定时任务签到。
- **增强版**：登录并保存 token 后立即签到，同时保留定时任务。

更换版本前，请先停用或删除旧模块/插件/重写规则，避免同一登录响应被执行两次。

## Shadowrocket

普通版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/shadowrocket/module.sgmodule
```

增强版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/shadowrocket/module-enhanced.sgmodule
```

操作步骤：

1. 在“模块”中添加上面的一个地址。
2. 开启 HTTPS 解密（MITM）。
3. 安装并信任 Shadowrocket 证书。
4. 打开任一支持域名并重新登录。
5. 收到 `网际快车登录凭证抓取成功` 通知后，可手动运行 `ks-checkin` 测试。

## Surge

普通版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/surge/module.sgmodule
```

增强版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/surge/module-enhanced.sgmodule
```

操作步骤：

1. 在“模块”中安装上面的一个地址。
2. 开启 MITM，并安装、信任 Surge 证书。
3. 打开任一支持域名并重新登录。
4. 收到 token 捕获通知后，可长按 `ks-checkin` 手动测试。

## Loon

普通版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/loon/plugin.plugin
```

增强版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/loon/plugin-enhanced.plugin
```

操作步骤：

1. 在“插件”中安装上面的一个地址。
2. 开启 MITM，并安装、信任 Loon 证书。
3. 打开任一支持域名并重新登录。
4. 收到 token 捕获通知后，手动运行一次签到任务测试。

## Quantumult X

Quantumult X 需要分别添加“重写资源”和“定时任务”。

### 1. 添加重写资源

普通版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/rewrite.conf
```

增强版：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/rewrite-enhanced.conf
```

在 Quantumult X 的重写资源中添加其中一个地址，并启用该资源。不要同时添加两个版本。

### 2. 添加定时任务

将以下内容加入配置文件：

```ini
[task_local]
0 8,12,21 * * * https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/checkin.js, tag=KS Auto Checkin, enabled=true
30 8 * * * https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/token-check.js, tag=KS Token Check, enabled=true
```

相同内容也保存在：

```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/remote-task.conf
```

### 3. 启用 MITM

1. 开启 MitM。
2. 安装并信任 Quantumult X 证书。
3. 确认重写资源已启用。
4. 打开任一支持域名并重新登录。
5. 收到 token 捕获通知后，手动运行 `KS Auto Checkin` 测试。

## 验证

登录成功后应看到类似通知：

```text
网际快车登录凭证抓取成功
84.wj-kc.com
登录凭证已保存，可用于自动签到。
```

普通版随后可手动运行签到任务。增强版会在登录后立即显示签到结果。

## 常见问题

### 未获取到 token

依次检查：

1. 是否只启用了一个模块、插件或重写版本。
2. HTTPS 解密/MITM 是否开启。
3. 证书是否已安装并被系统信任。
4. 登录域名是否在支持列表中。
5. 是否真正执行了重新登录，而不是直接进入已有登录状态的页面。
6. 远程脚本是否已刷新到最新版本。

### Token 已失效

重新打开网页登录。登录接口响应后，脚本会覆盖保存的新 token。

### Token 检查失败

“网络或接口异常”不等于 token 失效。先确认网络和域名可用，再重新运行检查任务。

### 签到失败

可能原因包括 token 过期、当天已签到、接口返回异常或域名暂时不可用。请查看 App 脚本日志中的原始响应。

### 更新后没有生效

远程脚本默认每 86400 秒检查一次更新。可手动刷新模块/插件/重写资源，或删除后重新导入。

## 数据与安全

- 脚本不保存账号和密码。
- token 保存在对应代理 App 的本地持久化存储中。
- 当前脚本只把 token 作为 Cookie 发送到预置的三个签到域名。
- MITM 可以读取登录响应，必须只安装和信任来自自己代理 App 的证书。
- 远程脚本更新后会在本机执行。建议检查更新内容，或 Fork 仓库并固定到自己审查过的 commit。
- 请勿在 Issue、日志截图或提交中公开真实 token。

## 本地测试

仓库不依赖第三方 npm 包。安装 Node.js 18 或更高版本后运行：

```bash
node tests/smoke-test.js
```

测试会模拟四个平台的运行环境，检查 token 捕获、域名边界、增强版立即签到、定时签到及错误提示。GitHub Actions 也会在 push 和 pull request 时自动执行语法检查和冒烟测试。

## 目录

```text
shadowrocket/
  capture-token.js
  capture-token-checkin.js
  checkin.js
  token-check.js
  module.sgmodule
  module-enhanced.sgmodule
surge/
  capture-token.js
  capture-token-checkin.js
  checkin.js
  token-check.js
  module.sgmodule
  module-enhanced.sgmodule
quantumultx/
  capture-token.js
  capture-token-checkin.js
  checkin.js
  token-check.js
  rewrite.conf
  rewrite-enhanced.conf
  remote-task.conf
loon/
  capture-token.js
  capture-token-checkin.js
  checkin.js
  token-check.js
  plugin.plugin
  plugin-enhanced.plugin
```
