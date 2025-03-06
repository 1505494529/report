document.addEventListener('DOMContentLoaded', () => {
  const openMainButton = document.getElementById('openMain');
  const statusDiv = document.getElementById('status');
  
  // 打开主页面按钮
  openMainButton.addEventListener('click', async () => {
    const isLoggedIn = await checkLoginStatus();
    
    if (isLoggedIn) {
      chrome.runtime.sendMessage({ action: "openMainPage" });
    } else {
      showStatus('请先登录有道账号', 'error');
    }
  });
  
  // 显示状态信息
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }

  async function checkLoginStatus() {
    try {
      const cookie = await new Promise((resolve) => {
        chrome.cookies.getAll({ domain: "youdao.com" }, (cookies) => {
          const cookieString = cookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; ");
          resolve(cookieString);
        });
      });

      const response = await fetch(
        'https://icodecontest-online-api.youdao.com/api/admin/class/getClassList?page=1&size=20',
        {
          headers: {
            "accept": "application/json",
            "cookie": cookie,
            "Referer": "https://icode-admin.youdao.com/"
          }
        }
      );

      const data = await response.json();
      return data.code === 0;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }
}); 