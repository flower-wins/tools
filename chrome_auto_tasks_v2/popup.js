document.addEventListener('DOMContentLoaded', () => {
  // 渲染指定类型的任务列表并为按钮绑定事件
  function renderTasks(tasks, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // 清空现有列表，以便重新渲染

    if (!tasks || tasks.length === 0) {
      // 可以选择显示一条消息，例如 "暂无任务"
      // container.innerHTML = '<p>暂无任务</p>';
      return;
    }

    tasks.forEach((task, i) => {
      const div = document.createElement('div');
      div.className = 'task';
      div.innerHTML = `
        📌 ${type === 'open' ? '每' + task.interval + '天打开一次' : type === 'bg' ? '每' + task.interval + '分钟后台访问' : '每' + task.interval + '分钟刷新标签页'}<br>
        ⏰ 下一次：${new Date(task.nextTime).toLocaleString()}<br>
        🔗 ${task.url}<br>
        <button class="remove-task-btn" data-type="${type}" data-index="${i}">删除任务</button>
        <button class="run-now-btn" data-type="${type}" data-index="${i}">立即执行</button>
      `;
      container.appendChild(div);
    });

    // 为新渲染的“删除任务”按钮批量添加事件监听器
    document.querySelectorAll(`#${containerId} .remove-task-btn`).forEach(button => {
      button.addEventListener('click', handleRemoveTask);
    });

    // 为新渲染的“立即执行”按钮批量添加事件监听器
    document.querySelectorAll(`#${containerId} .run-now-btn`).forEach(button => {
      button.addEventListener('click', handleRunNow);
    });
  }

  // 处理删除任务的事件
  function handleRemoveTask(event) {
    const type = event.target.dataset.type;
    const index = parseInt(event.target.dataset.index);
    removeTask(type, index);
  }

  // 处理立即执行任务的事件
  function handleRunNow(event) {
    const type = event.target.dataset.type;
    const index = parseInt(event.target.dataset.index);
    runNow(type, index);
  }

  // 从存储中删除任务并重新渲染列表
  function removeTask(type, index) {
    chrome.storage.local.get([type + 'Tasks'], res => {
      const tasks = res[type + 'Tasks'] || [];
      if (index >= 0 && index < tasks.length) {
        tasks.splice(index, 1);
        chrome.storage.local.set({ [type + 'Tasks']: tasks }, () => {
          // 根据类型重新渲染对应的任务列表
          if (type === 'open') {
            renderTasks(tasks, 'taskList', 'open');
          } else if (type === 'bg') {
            renderTasks(tasks, 'bgTaskList', 'bg');
          } else if (type === 'refresh') {
            renderTasks(tasks, 'refreshTaskList', 'refresh');
          }
        });
      } else {
        console.error('删除任务时索引无效:', type, index);
      }
    });
  }

  // 发送消息到 background.js 以立即执行任务
  function runNow(type, index) {
    // 可以加一个简单的反馈，比如按钮状态变化或短暂提示
    console.log(`请求立即执行任务: ${type} - 索引 ${index}`);
    chrome.runtime.sendMessage({ type: 'runNow', taskType: type, index: index });
  }

  // 重新加载所有任务列表的函数
  function loadAllTaskLists() {
    chrome.storage.local.get(['openTasks', 'bgTasks', 'refreshTasks'], res => {
      renderTasks(res.openTasks || [], 'taskList', 'open');
      renderTasks(res.bgTasks || [], 'bgTaskList', 'bg');
      renderTasks(res.refreshTasks || [], 'refreshTaskList', 'refresh');
    });
  }

  // 为“添加任务”按钮绑定事件
  document.getElementById('addTask').addEventListener('click', () => {
    const urlInput = document.getElementById('url');
    const intervalInput = document.getElementById('interval');
    const url = urlInput.value.trim();
    const interval = parseInt(intervalInput.value);

    if (!url || !url.startsWith('http://') && !url.startsWith('https://')) {
        alert('请输入有效的网址（以 http:// 或 https:// 开头）');
        return;
    }
    if (isNaN(interval) || interval <= 0) {
        alert('请输入有效的正整数间隔天数');
        return;
    }

    const nextTime = Date.now() + interval * 24 * 60 * 60 * 1000;
    chrome.storage.local.get(['openTasks'], res => {
      const openTasks = res.openTasks || [];
      openTasks.push({ url, interval, nextTime });
      chrome.storage.local.set({ openTasks }, () => {
        urlInput.value = ''; // 清空输入框
        intervalInput.value = ''; // 清空输入框
        renderTasks(openTasks, 'taskList', 'open'); // 重新渲染打开网页任务列表
      });
    });
  });

  // 为“添加后台访问任务”按钮绑定事件
  document.getElementById('addBgTask').addEventListener('click', () => {
    const urlInput = document.getElementById('bg-url');
    const intervalInput = document.getElementById('bg-interval');
    const url = urlInput.value.trim();
    const interval = parseInt(intervalInput.value);

    if (!url || !url.startsWith('http://') && !url.startsWith('https://')) {
        alert('请输入有效的网址（以 http:// 或 https:// 开头）');
        return;
    }
    if (isNaN(interval) || interval <= 0) {
        alert('请输入有效的正整数间隔分钟');
        return;
    }

    const nextTime = Date.now() + interval * 60 * 1000;
    chrome.storage.local.get(['bgTasks'], res => {
      const bgTasks = res.bgTasks || [];
      bgTasks.push({ url, interval, nextTime });
      chrome.storage.local.set({ bgTasks }, () => {
        urlInput.value = '';
        intervalInput.value = '';
        renderTasks(bgTasks, 'bgTaskList', 'bg'); // 重新渲染后台任务列表
      });
    });
  });

  // 为“添加刷新任务”按钮绑定事件
  document.getElementById('addRefreshTask').addEventListener('click', () => {
    const urlInput = document.getElementById('refresh-url');
    const intervalInput = document.getElementById('refresh-interval');
    const url = urlInput.value.trim();
    const interval = parseInt(intervalInput.value);

    if (!url) { // 刷新任务的 URL 可以是任何字符串，不强制 http/https
        alert('请输入有效的网址前缀');
        return;
    }
    if (isNaN(interval) || interval <= 0) {
        alert('请输入有效的正整数间隔分钟');
        return;
    }

    const nextTime = Date.now() + interval * 60 * 1000;
    chrome.storage.local.get(['refreshTasks'], res => {
      const refreshTasks = res.refreshTasks || [];
      refreshTasks.push({ url, interval, nextTime });
      chrome.storage.local.set({ refreshTasks }, () => {
        urlInput.value = '';
        intervalInput.value = '';
        renderTasks(refreshTasks, 'refreshTaskList', 'refresh'); // 重新渲染刷新任务列表
      });
    });
  });

  // 初始加载所有任务列表
  loadAllTaskLists();
});