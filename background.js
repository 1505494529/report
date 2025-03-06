// 处理cookie获取的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    chrome.cookies.getAll({ domain: "youdao.com" }, (cookies) => {
      const cookieString = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
      sendResponse({ cookie: cookieString });
    });
    return true; // 保持消息通道打开，等待异步响应
  }
  
  if (request.action === "openMainPage") {
    chrome.tabs.create({ url: "main.html" });
  }
});

// 初始化存储默认配置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['classId', 'examLesson', 'endTime', 'plan'], (result) => {
    const defaultSettings = {};
    
    // 只有在存储中完全没有这些值时才设置默认值
    if (!result.plan) {
      defaultSettings.plan = JSON.stringify([
        "第1单元:cout语句,掌握定义变赋值,掌握输出变量的值,理解程序框架,学会看报错信息",
        "第2单元:cin语句,理解输入概念,表达式的输出,整取余",
        "第3单元:double,输出 保留几位小数,自动类型转换,强制类型转换,<cmath>中的sqrt, ceil, floor, pow",
        "第4单元:小测",
        "第5单元:char类型,bool类型,if 开头：关系运算符，嵌套",
        "第6单元:找4个题复习一下if语句,if...else... , if...else if ... else,逻辑运算符 && || !,应用题结合大小数字字符,三目运算符",
        "第7单元:while语句,whlile 循环次数 重复做多次 循环计数器变量,掌握累加器变量,掌握while嵌套 if",
        "第8单元:小测",
        "第9单元:for语句,for + if嵌套,掌握计数器变量,掌握找最值的方法",
        "第10单元:for嵌套,掌握画图形的规律：两层循环i，j对应行列关系,多重for循环",
        "第11单元:break 和 continue,掌握flag变量的使用",
        "第12单元:小测",
        "第13单元:一维数组的声明和定义int,double,char,输输出数组,顺逆序遍历数组0~n-1，1~n-1~0，n~1,下值",
        "第14单元:string字符串,size(),length()",
        "第15单元:阅读题目，抽象数学思维，锻炼代码能力,输出下标和值 来调试代码,遍历数组",
        "第16单元:小测",
        "第17单元:二维数组",
        "第18单元:二维数组综合",
        "第19单元:函数",
        "第20单元:小测"
      ], null, 2);
    }
    
    // 只有在有默认值需要设置时才调用 storage.set
    if (Object.keys(defaultSettings).length > 0) {
      chrome.storage.local.set(defaultSettings);
    }
  });
}); 