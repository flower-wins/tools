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

部署步骤：
连接到你的 VPS：
使用 SSH 连接到你的 VPS。

bash
复制
编辑
ssh user@your_vps_ip
下载 deploy_url_checker.sh 脚本：
你可以通过 wget 或 curl 命令直接从 GitHub 下载脚本。

bash
复制
编辑
wget https://raw.githubusercontent.com/flower-wins/tools/main/url-checker/deploy_url_checker.sh -O deploy_url_checker.sh
或者，使用 curl：

bash
复制
编辑
curl -o deploy_url_checker.sh https://raw.githubusercontent.com/flower-wins/tools/main/url-checker/deploy_url_checker.sh
赋予脚本执行权限：
执行以下命令为脚本添加执行权限。

bash
复制
编辑
chmod +x deploy_url_checker.sh
运行脚本进行部署：
运行脚本来部署 URL 检查器。

bash
复制
编辑
sudo ./deploy_url_checker.sh
这会完成以下操作：

克隆 GitHub 仓库。

安装必备的依赖，如 git、curl、mailutils 和 cron。

配置 .env 文件和 cron 定时任务。

赋予 check_urls.sh 执行权限。

配置定时任务每分钟检查 URL，每天清空日志。

检查 URL 检查器是否工作正常：
脚本运行完成后，你可以查看定时任务是否已成功设置：

bash
复制
编辑
crontab -l
你会看到类似下面的输出：

ruby
复制
编辑
* * * * * /opt/tools/url-checker/check_urls.sh
0 0 * * * echo "" > /opt/tools/url-checker/url_check.log
这表明脚本会每分钟运行一次，并且每天会清空日志文件。

修改配置文件（如果需要）：

如果需要修改 URL 列表、通知设置等，编辑 .env 文件。

bash
复制
编辑
nano /opt/tools/url-checker/.env
修改后，保存并退出编辑器。

常见问题排查：
Cron 不工作：
如果你的定时任务没有按预期工作，检查 cron 服务是否正常运行：

bash
复制
编辑
sudo service cron status
如果没有运行，可以启动 cron 服务：

bash
复制
编辑
sudo service cron start
通知不发送：
如果你配置了 Telegram 或邮件通知，但没有收到通知：

确保 .env 中配置了正确的 Telegram bot token 和 chat ID，或者正确的邮件地址。

确保 mailutils 已安装（邮件通知）。

查看日志：
你可以查看生成的日志文件，了解 URL 检查结果：

bash
复制
编辑
cat /opt/tools/url-checker/url_check.log


✅ 部署脚本 (deploy_url_checker.sh)
你可以将以下内容保存为 deploy_url_checker.sh，然后运行它来自动部署。

🚀 使用说明：
将脚本保存为 deploy_url_checker.sh。

上传到你的 VPS 上，假设你已经通过 SSH 连接到你的服务器。

赋予脚本执行权限：

bash
chmod +x deploy_url_checker.sh

运行脚本：

bash
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
