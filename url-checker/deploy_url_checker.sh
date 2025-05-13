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
