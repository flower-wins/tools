function loadTasks() {
  chrome.storage.local.get('tasks', (result) => {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    const tasks = result.tasks || [];

    tasks.forEach(task => {
      const div = document.createElement('div');
      div.className = 'task';

      const dateStr = new Date(task.triggerTime).toLocaleString();
      div.innerHTML = `
        <strong>${task.url}</strong><br>
        每 ${task.intervalDays} 天一次，下一次：${dateStr}
        <br>
        <button data-id="${task.id}" class="delete-btn">删除任务</button>
        <button data-url="${task.url}" class="run-btn">立即打开</button>
      `;

      taskList.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-id');
        removeTask(id);
      });
    });

    document.querySelectorAll('.run-btn').forEach(button => {
      button.addEventListener('click', () => {
        const url = button.getAttribute('data-url');
        if (url) {
          chrome.tabs.create({ url });
        }
      });
    });
  });
}

function removeTask(id) {
  chrome.storage.local.get('tasks', (result) => {
    const tasks = result.tasks || [];
    const updated = tasks.filter(task => task.id !== id);
    chrome.storage.local.set({ tasks: updated }, () => {
      chrome.alarms.clear(id);
      loadTasks();
    });
  });
}

document.getElementById('addTask').addEventListener('click', () => {
  const url = document.getElementById('url').value.trim();
  const interval = parseInt(document.getElementById('interval').value);

  if (!url || isNaN(interval) || interval <= 0) {
    alert('请输入有效的网址和间隔天数。');
    return;
  }

  const triggerTime = Date.now() + interval * 24 * 60 * 60 * 1000;
  const taskId = 'task_' + Date.now();
  const newTask = { id: taskId, url: url, intervalDays: interval, triggerTime };

  chrome.storage.local.get('tasks', (result) => {
    const tasks = result.tasks || [];
    tasks.push(newTask);
    chrome.storage.local.set({ tasks }, () => {
      chrome.alarms.create(taskId, { when: triggerTime });
      loadTasks();
      document.getElementById('url').value = '';
      document.getElementById('interval').value = '';
    });
  });
});

loadTasks();
