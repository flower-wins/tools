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
  BODY=$(curl -s --max-time 10 "$URL")

  # 判断是否为 Base64 编码
  if [[ "$STATUS" != "200" || ! "$BODY" =~ ^[A-Za-z0-9+/=]+$ ]]; then
    MESSAGE="[$TIMESTAMP] ❌ $URL failed (Status: $STATUS, Not Base64)"
    echo "$MESSAGE" >> "$LOG_FILE"
  else
    # 解码并检查是否包含协议
    DECODED=$(echo "$BODY" | base64 -d 2>/dev/null)
    if echo "$DECODED" | grep -qE '^(vmess|vless|trojan|ss|ssr)://'; then
      continue
    else
      MESSAGE="[$TIMESTAMP] ❌ $URL invalid decoded content"
      echo "$MESSAGE" >> "$LOG_FILE"
    fi
  fi

  # 通知（仅当出错）
  if [[ -n "$TG_BOT_TOKEN" && -n "$TG_CHAT_ID" ]]; then
    curl -s -X POST "https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage"          -d chat_id="$TG_CHAT_ID"          -d text="$MESSAGE" > /dev/null
  fi

  if [[ -n "$EMAIL" ]]; then
    command -v mail >/dev/null 2>&1 && echo "$MESSAGE" | mail -s "URL 检测失败: $URL" "$EMAIL"
  fi
done
