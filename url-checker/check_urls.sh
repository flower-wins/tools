#!/bin/bash

# === 自动定位 .env 文件 ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="$SCRIPT_DIR/.env"

if [ -f "$ENV_PATH" ]; then
  source "$ENV_PATH"
else
  echo "[$(date)] ❌ ERROR: Config file $ENV_PATH not found."
  exit 1
fi

# === 时间戳 & 最大日志检查 ===
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
MAX_SIZE_BYTES=$((MAX_SIZE_MB * 1024 * 1024))

if [ -f "$LOG_FILE" ] && [ $(stat -c %s "$LOG_FILE") -ge $MAX_SIZE_BYTES ]; then
  echo "[$TIMESTAMP] ⚠️ Log exceeded $MAX_SIZE_MB MB, truncating." > "$LOG_FILE"
fi

# === 检查 URL 状态 ===
for URL in $URLS; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

  if [ "$STATUS" != "200" ]; then
    MESSAGE="[$TIMESTAMP] ❌ $URL failed (Status: $STATUS)"
    echo "$MESSAGE" >> "$LOG_FILE"

    # Telegram 通知（如有配置）
    if [[ -n "$TG_BOT_TOKEN" && -n "$TG_CHAT_ID" ]]; then
      curl -s -X POST "https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage"            -d chat_id="$TG_CHAT_ID"            -d text="$MESSAGE" > /dev/null
    fi

    # 邮件通知（如有配置 & 系统支持）
    if [[ -n "$EMAIL" ]]; then
      command -v mail >/dev/null 2>&1 && echo "$MESSAGE" | mail -s "URL 检测失败: $URL" "$EMAIL"
    fi
  fi
done
