// 获取cookie
async function getCookie() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getCookies" }, (response) => {
      resolve(response.cookie);
    });
  });
}

// 显示进度条
function showProgress(container, current, total, message) {
  const percentage = Math.floor((current / total) * 100);
  const progressBar = container.querySelector('.progress-bar');
  const progressText = container.querySelector('.progress-text');
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
  }
  
  if (progressText) {
    progressText.textContent = `${message}: ${current}/${total} (${percentage}%)`;
  }
}

// 保存设置
function saveSettings(settings) {
  return chrome.storage.local.set(settings);
}

// 获取设置
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['classId', 'examLesson', 'endTime', 'plan'], (result) => {
      resolve(result);
    });
  });
}

// 异步请求封装
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      retries++;
      console.warn(`请求失败: ${error.message}. 重试 (${retries}/${maxRetries})...`);
      if (retries === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}

// API请求函数
async function apiRequest(url, method = 'GET', body = null) {
  const cookie = await getCookie();
  
  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/json;charset=UTF-8",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Microsoft Edge\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "cookie": cookie,
    "Referer": "https://icode-admin.youdao.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };
  
  return fetchWithRetry(url, options);
}

// 并行处理数据
async function processInParallel(items, processFn, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  
  return results;
}

// 导出函数
export {
  getCookie,
  showProgress,
  saveSettings,
  getSettings,
  fetchWithRetry,
  apiRequest,
  processInParallel
}; 