chrome.runtime.onInstalled.addListener(() => {
  restoreAlarmsFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  restoreAlarmsFromStorage();
});

function restoreAlarmsFromStorage() {
  chrome.storage.local.get('tasks', (result) => {
    const now = Date.now();
    const tasks = result.tasks || [];

    tasks.forEach(task => {
      if (task.triggerTime > now) {
        chrome.alarms.create(task.id, {
          when: task.triggerTime
        });
      }
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get('tasks', (result) => {
    let tasks = result.tasks || [];
    const task = tasks.find(t => t.id === alarm.name);

    if (task) {
      chrome.tabs.create({ url: task.url });

      // 自动重新设定任务
      const nextTriggerTime = Date.now() + task.intervalDays * 24 * 60 * 60 * 1000;
      const updatedTask = {
        ...task,
        triggerTime: nextTriggerTime
      };

      tasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      chrome.storage.local.set({ tasks });
      chrome.alarms.create(task.id, { when: nextTriggerTime });
    }
  });
});
