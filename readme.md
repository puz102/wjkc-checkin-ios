# KS 网际快车 自动签到模板（iOS / macOS 代理 APP）

适用于：
- Shadowrocket
- Surge
- Quantumult X
- Loon

---

## 功能
- 支持多域名自动识别
- 网页登录后自动抓取 token
- 自动保存 token
- 定时自动签到
- 签到失败自动 fallback 其他域名
- 不保存账号密码，只保存 token

---

## 支持域名
本模板已预置以下公开域名：

- `wj-kc.com`
- `84.wj-kc.com`
- `ks.wjkc.xyz`

---

## 工作原理
1. 在 APP 里导入对应模块/插件
2. 在网页端登录账号
3. APP 自动拦截登录响应
4. 自动提取 `Set-Cookie` 中的 `token`
5. 按域名保存到 APP 本地存储
6. 定时任务使用已保存的 token 签到

---

## 使用步骤

### 1）下载或 Fork 仓库
```text
https://github.com/puz102/wjkc-checkin-ios
```

### 2）替换仓库路径
将脚本/模块中的：
```text
OWNER/REPO
```
替换成你自己的仓库路径，例如：
```text
puz102/wjkc-checkin-ios
```

### 3）导入到对应 APP

#### Shadowrocket
- 导入 `shadowrocket/module.sgmodule`
- 开启 MITM
- 信任证书

#### Surge
- 导入 `surge/module.sgmodule`
- 开启 MITM
- 信任证书

#### Quantumult X
- 引用远程任务 `quantumultx/remote-task.conf`
- 添加远程脚本
- 开启 MITM
- 信任证书

#### Loon
- 导入 `loon/plugin.plugin`
- 开启 MITM
- 信任证书

### 4）在网页登录一次
打开任意支持域名登录：
- `https://wj-kc.com/#/`
- `https://84.wj-kc.com/#/`
- `https://ks.wjkc.xyz/#/`

### 5）等待自动签到
默认定时：
```text
0 8,12,21 * * *
```

---

## 建议 cron
```text
0 8,12,21 * * *
```

含义：
- 8:00
- 12:00
- 21:00

---

## 常见问题

### 为什么需要 MITM？
因为要从 HTTPS 响应头中读取登录后的 `Set-Cookie`。

### 为什么需要信任证书？
开启 MITM 后，APP 需要安装并信任对应 CA 证书。

### token 会过期吗？
会。过期后重新在网页登录一次即可。

### 密码会保存吗？
不会。本模板只保存 token，不保存账号密码。

### 为什么设计成多域名？
因为站点本身有多个入口域名，多域名可以提高可用性。

---

## 安全说明
- 请勿提交真实 token
- 请勿提交账号密码
- token 仅保存在 APP 本地存储
- 若需公开发布，请保持占位符或私有仓库

---

## 目录结构
```text
shadowrocket/
  capture-token.js
  checkin.js
  module.sgmodule
surge/
  capture-token.js
  checkin.js
  module.sgmodule
quantumultx/
  capture-token.js
  checkin.js
  remote-task.conf
loon/
  capture-token.js
  checkin.js
  plugin.plugin
```
