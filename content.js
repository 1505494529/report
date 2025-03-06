// 接收来自popup或main页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkLoggedIn") {
    // 检查是否已登录
    const isLoggedIn = document.cookie.includes("DICT_LOGIN") || 
                       document.cookie.includes("P_INFO");
    sendResponse({ loggedIn: isLoggedIn });
  }
});

// 页面加载完成时发送登录状态
window.addEventListener('load', () => {
  chrome.runtime.sendMessage({
    action: "loginStatus",
    loggedIn: document.cookie.includes("DICT_LOGIN") || 
              document.cookie.includes("P_INFO")
  });
}); 