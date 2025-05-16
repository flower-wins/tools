chrome.runtime.onInstalled.addListener(() => {
  console.log('插件安装或更新');
});

// 此函数在您的原始代码中存在，但未被直接调用。
// 如果打算在添加任务时也立即设置闹钟，可以考虑在此处或popup.js中调用相关逻辑。
// function scheduleAlarms(tasks, type) {
//   tasks.forEach((task, index) => {
//     const name = type + '-' + index;
//     chrome.alarms.create(name, { when: task.nextTime });
//   });
// }

// 重新调度指定类型的所有任务的闹钟
function rescheduleTasksOfType(type) {
  chrome.storage.local.get([type + 'Tasks'], res => {
    const tasks = res[type + 'Tasks'] || [];
    // 清除该类型旧的闹钟，以防任务数量减少或索引变化
    tasks.forEach((_, index) => {
        //尝试清除旧的闹钟，以防万一。如果任务数量变化，旧的闹钟需要被正确处理
        //更稳妥的做法是，在存储任务时，为每个任务分配一个唯一ID，并用ID作为闹钟名
    });

    // 为当前任务列表创建新的闹钟
    tasks.forEach((task, index) => {
      const alarmName = `<span class="math-inline">\{type\}\-</span>{index}`; // 使用索引作为闹钟名的一部分
      if (task.nextTime && task.nextTime > Date.now()) { // 确保有下一次执行时间且在未来
        chrome.alarms.create(alarmName, { when: task.nextTime });
        console.log(`闹钟已创建/更新: ${alarmName} 在 ${new Date(task.nextTime).toLocaleString()}`);
      }
    });
  });
}

// 初始化或重新加载插件时，为所有类型的任务重新调度闹钟
function initializeAllAlarms() {
    ['open', 'bg', 'refresh'].forEach(type => rescheduleTasksOfType(type));
}

// 插件启动时初始化所有闹钟
initializeAllAlarms();

// 监听存储变化，如果任务列表变化，则重新调度闹钟
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    const taskTypes = ['openTasks', 'bgTasks', 'refreshTasks'];
    let needsReschedule = false;
    for (const key in changes) {
      if (taskTypes.includes(key)) {
        console.log(`存储中的 ${key} 发生变化，重新调度闹钟。`);
        // 提取类型，例如 'openTasks' -> 'open'
        const type = key.substring(0, key.length - 5);
        rescheduleTasksOfType(type);
        needsReschedule = true; //标记需要重新调度
      }
    }
    //如果上面没有精确匹配到类型，可以考虑重新初始化所有闹钟，但这可能效率较低
    // if(needsReschedule){
    //     initializeAllAlarms();
    // }
  }
});


// 闹钟触发处理
chrome.alarms.onAlarm.addListener(alarm => {
  console.log('闹钟触发:', alarm.name);
  const parts = alarm.name.split('-');
  if (parts.length < 2) {
      console.error('闹钟名称格式不正确:', alarm.name);
      return;
  }
  const type = parts[0];
  const index = parseInt(parts[parts.length -1]); //假设索引总是在最后

  if (isNaN(index)) {
      console.error('从闹钟名称中解析索引失败:', alarm.name);
      return;
  }


  chrome.storage.local.get([type + 'Tasks'], res => {
    const tasks = res[type + 'Tasks'] || [];
    const task = tasks[index];

    if (!task) {
      console.warn(`闹钟 ${alarm.name}: 未找到任务 (索引 ${index})。可能已被删除。`);
      chrome.alarms.clear(alarm.name); // 清理无效闹钟
      return;
    }

    // 再次检查时间，虽然闹钟应该在正确时间触发，但作为保险
    if (Date.now() < task.nextTime) {
      console.log(`闹钟 ${alarm.name}: 未到执行时间，重新安排到 ${new Date(task.nextTime).toLocaleString()}`);
      chrome.alarms.create(alarm.name, { when: task.nextTime }); // 重新安排
      return;
    }

    console.log(`执行任务 <span class="math-inline">\{type\}\[</span>{index}]:`, task.url);

    if (type === 'open') {
      chrome.windows.getAll({ populate: true }, (windows) => {
        if (windows.length > 0) {
          chrome.tabs.create({ url: task.url });
        } else {
            // 如果没有窗口，创建一个新窗口再打开标签页
            chrome.windows.create({url: task.url});
        }
      });
    } else if (type === 'bg') {
      fetch(task.url)
        .then(response => {
            if(!response.ok){
                console.error(`后台访问 ${task.url} 失败，状态: ${response.status}`);
            } else {
                console.log('后台访问成功：', task.url);
            }
        })
        .catch(err => console.error(`后台访问 ${task.url} 网络错误:`, err));
    } else if (type === 'refresh') {
      chrome.tabs.query({}, tabs => {
        let refreshed = false;
        tabs.forEach(tab => {
          if (tab.url && tab.url.startsWith(task.url)) {
            chrome.tabs.reload(tab.id, () => {
                if (chrome.runtime.lastError) {
                    console.error(`刷新标签页 <span class="math-inline">\{tab\.id\} \(</span>{tab.url}) 失败:`, chrome.runtime.lastError.message);
                } else {
                    console.log(`标签页 <span class="math-inline">\{tab\.id\} \(</span>{tab.url}) 已刷新`);
                }
            });
            refreshed = true;
          }
        });
        if (!refreshed) {
            console.warn(`刷新任务: 没有找到与前缀 "${task.url}" 匹配的标签页。`);
        }
      });
    }

    // 重新安排下一次执行时间
    const intervalMs = (type === 'open') ? (task.interval * 24 * 60 * 60 * 1000) : (task.interval * 60 * 1000);
    task.nextTime = Date.now() + intervalMs;
    tasks[index] = task; // 更新任务对象中的 nextTime

    chrome.storage.local.set({ [type + 'Tasks']: tasks }, () => {
      // 为这个任务创建下一个闹钟
      chrome.alarms.create(alarm.name, { when: task.nextTime });
      console.log(`任务 ${alarm.name} 下一次执行时间: ${new Date(task.nextTime).toLocaleString()}`);
    });
  });
});

// 立即执行消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'runNow') {
    chrome.storage.local.get([msg.taskType + 'Tasks'], res => {
      const tasks = res[msg.taskType + 'Tasks'] || [];
      const task = tasks[msg.index];
      if (!task) {
        console.log(`立即执行: 未找到任务 <span class="math-inline">\{msg\.taskType\}\[</span>{msg.index}]`);
        sendResponse({success: false, message: '未找到任务'});
        return true; // 异步sendResponse
      }

      console.log('立即执行任务：', msg.taskType, msg.index, task);

      if (msg.taskType === 'open') {
        chrome.windows.getAll({ populate: true }, (windows) => {
          if (windows.length > 0) {
            chrome.tabs.create({ url: task.url });
          } else {
            chrome.windows.create({url: task.url});
          }
        });
      } else if (msg.taskType === 'bg') {
        fetch(task.url)
          .then(response => {
            if(!response.ok){
                console.error(`[立即执行] 后台访问 ${task.url} 失败，状态: ${response.status}`);
            } else {
                console.log('[立即执行] 后台访问成功：', task.url);
            }
        })
          .catch(err => console.error('[立即执行] 后台访问失败:', err));
      } else if (msg.taskType === 'refresh') {
        chrome.tabs.query({}, tabs => {
          let refreshed = false;
          tabs.forEach(tab => {
            if (tab.url && tab.url.startsWith(task.url)) {
              chrome.tabs.reload(tab.id);
              refreshed = true;
            }
          });
          if (!refreshed) {
            console.warn(`[立即执行] 刷新任务: 没有找到与前缀 "${task.url}" 匹配的标签页。`);
          }
        });
      }
      sendResponse({success: true, message: '任务已开始执行'});
    });
    return true; // 表示我们将异步发送响应
  }
});