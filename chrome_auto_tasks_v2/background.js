chrome.runtime.onInstalled.addListener(() => {
  console.log('插件安装或更新');
});

// 设置定时器
function rescheduleTasks(type) {
  chrome.storage.local.get([type + 'Tasks'], res => {
    const tasks = res[type + 'Tasks'] || [];
    tasks.forEach((task, index) => {
      const name = `${type}-${index}`;
      chrome.alarms.create(name, { when: task.nextTime });
    });
  });
}

// 初始化所有类型的定时器
['open', 'bg', 'refresh'].forEach(rescheduleTasks);

// 处理定时任务
chrome.alarms.onAlarm.addListener(alarm => {
  const [type, indexStr] = alarm.name.split('-');
  const index = parseInt(indexStr);

  chrome.storage.local.get([type + 'Tasks'], res => {
    const tasks = res[type + 'Tasks'] || [];
    const task = tasks[index];
    if (!task || Date.now() < task.nextTime) return;

    console.log(`[定时] 执行 ${type} 任务:`, task.url);

    if (type === 'open') {
      chrome.tabs.create({ url: task.url });
    }

    if (type === 'bg') {
      chrome.windows.create({
        url: task.url,
        type: 'popup',
        state: 'minimized',
        focused: false
      }, win => {
        setTimeout(() => {
          chrome.windows.remove(win.id, () => {
            console.log(`[后台访问] 已关闭窗口 ${win.id}`);
          });
        }, 10000); // 10 秒后自动关闭窗口
      });
    }

    if (type === 'refresh') {
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          if (tab.url && tab.url.startsWith(task.url)) {
            chrome.tabs.reload(tab.id);
          }
        });
      });
    }

    // 更新下次触发时间
    const intervalMs = (type === 'open') ? task.interval * 24 * 60 * 60 * 1000 : task.interval * 60 * 1000;
    task.nextTime = Date.now() + intervalMs;
    tasks[index] = task;
    chrome.storage.local.set({ [type + 'Tasks']: tasks }, () => {
      chrome.alarms.create(alarm.name, { when: task.nextTime });
    });
  });
});

// 立即执行任务
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'runNow') return;

  const type = msg.taskType;
  const index = msg.index;

  chrome.storage.local.get([type + 'Tasks'], res => {
    const tasks = res[type + 'Tasks'] || [];
    const task = tasks[index];
    if (!task) return;

    console.log(`[立即执行] ${type} 任务:`, task);

    if (type === 'open') {
      chrome.tabs.create({ url: task.url });
    }

    if (type === 'bg') {
      chrome.windows.create({
        url: task.url,
        type: 'popup',
        state: 'minimized',
        focused: false
      }, win => {
        setTimeout(() => {
          chrome.windows.remove(win.id, () => {
            console.log(`[立即执行] 后台访问窗口已关闭: ${win.id}`);
          });
        }, 10000); // 10 秒后关闭
      });
    }

    if (type === 'refresh') {
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          if (tab.url && tab.url.startsWith(task.url)) {
            chrome.tabs.reload(tab.id);
          }
        });
      });
    }
  });
});
