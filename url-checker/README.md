# URL 可用性检查脚本

定时检查多个 URL 是否可用，仅记录失败，并支持 Telegram/邮件通知。

## 📦 文件结构

- `check_urls.sh`：主脚本
- `.env`：配置文件
- `url_check.log`：运行时生成的日志文件

## 🚀 使用方法

1. 修改 `.env` 配置文件
2. 赋予执行权限：

```bash
chmod +x check_urls.sh
```

3. 测试运行：

```bash
./check_urls.sh
```

4. 设置定时任务：

```bash
crontab -e
```

添加：

```bash
* * * * * /your/path/to/check_urls.sh
0 0 * * * echo "" > /your/path/to/url_check.log
```

## 📢 通知说明

- 若未配置 `TG_BOT_TOKEN` 或 `EMAIL`，对应通知将自动跳过。
- 邮件通知依赖 `mailutils`，可使用 `apt install mailutils` 安装。

## 🔐 安全提示


✅ 部署脚本 (deploy_url_checker.sh)
你可以将以下内容保存为 deploy_url_checker.sh，然后运行它来自动部署。

bash
复制
编辑
#!/bin/bash

# 确保脚本以 root 用户或 sudo 权限运行
if [ "$(id -u)" -ne 0 ]; then
  echo "请以 root 用户或使用 sudo 运行此脚本！"
  exit 1
fi

# === 1. 安装必备依赖 ===
echo "正在安装依赖项..."
apt update
apt install -y git curl mailutils cron

# === 2. 克隆项目 ===
echo "正在克隆项目..."
cd /opt
git clone https://github.com/flower-wins/tools.git
cd tools/url-checker

# === 3. 配置 .env 文件 ===
echo "配置 .env 文件..."
cat > .env << EOF
# 多个 URL 使用空格分隔
URLS="https://webvps.fwds.dpdns.org/sub https://example.com"

# 日志文件路径（绝对路径或相对当前目录）
LOG_FILE="./url_check.log"

# 最大日志大小（单位 MB）
MAX_SIZE_MB=10

# Telegram 机器人信息（可选）
TG_BOT_TOKEN=""
TG_CHAT_ID=""

# 邮件地址（可选）
EMAIL=""
EOF

# === 4. 赋予脚本执行权限 ===
echo "赋予脚本执行权限..."
chmod +x /opt/tools/url-checker/check_urls.sh

# === 5. 配置 Cron 定时任务 ===
echo "配置 Cron 定时任务..."
(crontab -l 2>/dev/null; echo "* * * * * /opt/tools/url-checker/check_urls.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 0 * * * echo \"\" > /opt/tools/url-checker/url_check.log") | crontab -

# === 6. 提示用户完成部署 ===
echo "部署完成！"
echo "现在脚本将每分钟运行一次，并每天清空日志。"
echo "如果需要修改配置，编辑 /opt/tools/url-checker/.env 文件。"

# === 7. 测试运行脚本 ===
echo "测试运行脚本..."
/opt/tools/url-checker/check_urls.sh

echo "URL 检查脚本部署完成！"
🚀 使用说明：
将脚本保存为 deploy_url_checker.sh。

上传到你的 VPS 上，假设你已经通过 SSH 连接到你的服务器。

赋予脚本执行权限：

bash
复制
编辑
chmod +x deploy_url_checker.sh
运行脚本：

bash
复制
编辑
sudo ./deploy_url_checker.sh
🔧 详细步骤说明：
1. 安装必备依赖：
使用 apt install 安装 Git、curl、mailutils 和 cron 等工具，确保你的 VPS 上能够执行 Git 操作、发送邮件通知以及设置定时任务。

2. 克隆 GitHub 项目：
从 GitHub 仓库 https://github.com/flower-wins/tools.git 克隆代码，并进入 url-checker 目录。

3. 配置 .env 文件：
自动创建 .env 配置文件，包含了 URL 列表、日志文件路径、Telegram 和邮件通知设置（可以修改）。

4. 赋予脚本执行权限：
赋予 check_urls.sh 脚本执行权限，确保可以通过 cron 定时任务运行。

5. 配置 Cron 定时任务：
设置两个 cron 任务：

每分钟执行一次 URL 检查脚本。

每天 0 点清空日志文件。

6. 完成部署并测试：
完成部署后，自动执行一次脚本测试，确保一切正常。



- 建议将 `.env` 文件权限设为 600：

```bash
chmod 600 .env
```
