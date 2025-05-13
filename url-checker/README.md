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

- 建议将 `.env` 文件权限设为 600：

```bash
chmod 600 .env
```
