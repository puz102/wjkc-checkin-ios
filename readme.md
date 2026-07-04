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

### 2）确认仓库路径
本仓库已使用：
```text
puz102/wjkc-checkin-ios
```
如果你 Fork 后放到自己的仓库，请同步替换为你自己的路径。

### 3）导入到对应 APP

#### Shadowrocket
1. 打开 Shadowrocket
2. 模块 -> 添加模块
3. 导入远程模块地址：
```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/shadowrocket/module.sgmodule
```
4. 开启 MITM
5. 安装并信任证书
6. 打开网页登录一次，触发自动抓取 token

#### Surge
1. 打开 Surge
2. 模块 -> 安装模块
3. 导入远程模块地址：
```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/surge/module.sgmodule
```
4. 开启 MITM
5. 安装并信任证书
6. 打开网页登录一次，触发自动抓取 token

#### Quantumult X
1. 打开 Quantumult X
2. 引用远程任务：
```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/remote-task.conf
```
3. 添加远程脚本：
```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/capture-token.js
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/quantumultx/checkin.js
```
4. 开启 MITM
5. 安装并信任证书
6. 打开网页登录一次，触发自动抓取 token

#### Loon
1. 打开 Loon
2. 插件 -> 安装远程插件
3. 导入远程插件地址：
```text
https://raw.githubusercontent.com/puz102/wjkc-checkin-ios/main/loon/plugin.plugin
```
4. 开启 MITM
5. 安装并信任证书
6. 打开网页登录一次，触发自动抓取 token

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

## 如何确认 token 已抓到

### Shadowrocket
1. 打开 Shadowrocket
2. 查看脚本运行日志
3. 如果看到 `KS Token Captured` 通知，说明抓取成功
4. 也可以在运行签到脚本时观察是否提示“未获取到token”

### Surge
1. 打开 Surge
2. 查看脚本日志/通知
3. 如果看到 `KS Token Captured`，说明成功
4. 运行签到脚本，不再提示“未获取到token”即为正常

### Quantumult X
1. 打开 Quantumult X
2. 查看脚本通知/日志
3. 出现 `KS Token Captured` 即为成功
4. 运行签到脚本时不再提示缺 token

### Loon
1. 打开 Loon
2. 查看脚本通知
3. 出现 `KS Token Captured` 即为成功
4. 运行签到脚本时不再提示缺 token

---

## 更直接的验证方式
如果你希望更直观确认，可以按顺序做：

### 第 1 步：确保模块/插件已导入
### 第 2 步：确保 MITM 已开启
### 第 3 步：确保证书已信任
### 第 4 步：打开网页登录一次
### 第 5 步：回到 APP 查看通知

如果看到类似：
```text
KS Token Captured
wj-kc.com
Token stored for auto checkin.
```
就说明 token 已经成功抓到了。

---

## 如果没有看到抓取成功通知
请检查：
- 是否在支持的域名登录
- 是否开了 MITM
- 是否信任证书
- 是否正确导入模块/插件
- 是否被 APP 缓存影响

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

## 手动签到说明
如果你想立即测试，不必等定时任务，可手动触发。

### Shadowrocket
1. 打开 Shadowrocket
2. 脚本列表中选择 `checkin.js`
3. 运行一次

### Surge
1. 打开 Surge
2. 脚本列表中选择 `checkin.js`
3. 运行一次

### Quantumult X
1. 打开 Quantumult X
2. 脚本/任务列表中运行 `checkin.js`

### Loon
1. 打开 Loon
2. 脚本列表中运行 `checkin.js`

---

## 常见报错与排查

### 1）未获取到 token
```text
请先在网页登录，让模块自动抓取token
```
#### 原因
- 还没在网页登录
- 登录域名不在支持列表中
- MITM 未开启
- 证书未信任

#### 解决
1. 确认已开启 MITM
2. 确认已安装并信任证书
3. 在 `wj-kc.com` / `84.wj-kc.com` / `ks.wjkc.xyz` 登录一次
4. 重新运行签到脚本

---

### 2）签到失败
```text
签到失败
```
#### 原因
- token 已过期
- 域名临时不可用
- 接口返回异常

#### 解决
1. 重新登录网页一次
2. 等模块重新抓取 token
3. 再次运行签到脚本

---

### 3）签到成功但流量没增加
#### 可能原因
- 当天已签到
- 账号异常
- 系统延迟

#### 解决
1. 查看通知是否显示“已签到”
2. 等待几分钟再查看流量

---

### 4）MITM 不生效
#### 原因
- 未开启 MITM
- 未信任证书
- 域名未加入 MITM hostname

#### 解决
1. 确认 MITM hostname 包含：
   - `wj-kc.com`
   - `84.wj-kc.com`
   - `ks.wjkc.xyz`
2. 重新安装并信任证书

---

### 5）模块/脚本更新不生效
#### 解决
1. 清除远程脚本缓存
2. 手动刷新远程规则/脚本
3. 重新导入模块

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
