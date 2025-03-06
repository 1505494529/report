import {
  getCookie,
  showProgress,
  saveSettings,
  getSettings,
  apiRequest,
  processInParallel
} from './utils.js';

import { askAI, generateEvaluation, generateFinalReport } from './ai.js';

// 全局状态
let classId = null;  // 不设置默认值，由页面加载时动态设置
let examLesson = null;  // 不设置默认值，由页面加载时动态设置
let endTime = null;  // 不设置默认值，由当前时间动态设置
let endTimeDate = null;
let plan = [];
let courseId = null;
let lessonList = [];
let studentReports = {};
let currentExamIndex = 0;
let apiKey = null;  // 存储API-KEY

// DOM元素
const classIdInput = document.getElementById('classId');
const examLessonInput = document.getElementById('examLesson');
const endTimeInput = document.getElementById('endTime');
const apiKeyInput = document.getElementById('apiKey');  // 添加API-KEY输入框元素
const fetchReportsBtn = document.getElementById('fetchReportsBtn');
const planEditor = document.getElementById('planEditor');
const savePlanBtn = document.getElementById('savePlanBtn');
const progressContainer = document.getElementById('progressContainer');
const statusMessage = document.getElementById('statusMessage');
const bulkActions = document.getElementById('bulkActions');
const studentCards = document.getElementById('studentCards');
const generateAllBtn = document.getElementById('generateAllBtn');
const submitAllBtn = document.getElementById('submitAllBtn');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 设置默认截止时间为当前时间
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  endTimeInput.value = localDateTime;
  endTime = new Date(localDateTime).toLocaleString();
  endTimeDate = new Date(endTime);
  
  // 加载设置
  const settings = await getSettings();
  
  // 如果存储中有值，使用存储的值
  if (settings.classId) {
    classId = settings.classId;
  }
  
  if (settings.examLesson) {
    examLesson = settings.examLesson;
  }
  
  if (settings.endTime) {
    endTime = settings.endTime;
    endTimeDate = new Date(endTime);
    endTimeInput.value = new Date(endTime).toISOString().slice(0, 16);
  }
  
  if (settings.apiKey) {
    apiKey = settings.apiKey;
    apiKeyInput.value = apiKey;
  }
  
  if (settings.plan) {
    try {
      plan = JSON.parse(settings.plan);
    } catch (error) {
      console.error('解析知识点计划失败:', error);
      // 如果解析失败，使用默认的知识点计划
      plan = [
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
      ];
    }
  } else {
    // 如果settings中没有plan，使用默认的知识点计划
    plan = [
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
    ];
    // 保存默认计划到存储中
    await saveSettings({ plan: JSON.stringify(plan) });
  }
  
  // 获取班级列表并填充下拉框
  await loadClassList();
  
  // 填充表单
  classIdInput.value = classId;
  examLessonInput.value = examLesson;
  
  // 填充知识点计划
  planEditor.value = plan.join('\n');
  
  // 注册事件处理程序
  registerEventHandlers();
});

// 加载班级列表
async function loadClassList() {
  try {
    showStatusMessage('正在获取班级列表...', 'info');
    
    const response = await apiRequest(
      'https://icodecontest-online-api.youdao.com/api/admin/class/getClassList?page=1&size=100'
    );
    
    if (response.code === 0 && response.data.list) {
      const classList = response.data.list;
      const select = document.getElementById('classId');
      
      // 清空现有选项
      select.innerHTML = '';
      
      // 添加班级选项
      classList.forEach(classInfo => {
        const option = document.createElement('option');
        option.value = classInfo.id;
        option.textContent = `${classInfo.title} (${classInfo.studentNum}人)`;
        // 如果是当前选中的班级,设置为选中
        if (classInfo.id === classId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      
      // 如果没有选中的班级,选中第一个选项
      if (!select.value && classList.length > 0) {
        select.value = classList[0].id;
        classId = parseInt(classList[0].id, 10);
        saveCurrentSettings();
      }

      // 加载选中班级的课时列表
      await loadLessonList(classId);
      
      showStatusMessage('班级列表加载完成', 'success');
    } else {
      throw new Error('获取班级列表失败');
    }
  } catch (error) {
    console.error('加载班级列表失败:', error);
    showStatusMessage('加载班级列表失败: ' + error.message, 'error');
  }
}

// 加载课时列表
async function loadLessonList(classId) {
  try {
    showStatusMessage('正在获取课时列表...', 'info');
    
    // 先获取班级信息以获取youdaoCourseId
    const classListData = await apiRequest(
      'https://icodecontest-online-api.youdao.com/api/admin/class/getClassList?page=1&size=100'
    );
    
    const classInfo = classListData.data.list.find(c => c.id === parseInt(classId));
    if (!classInfo) {
      throw new Error('未找到班级信息');
    }
    
    const response = await apiRequest(
      `https://icodecontest-online-api.youdao.com/api/admin/course/getTuringCoursesByYoudaoCourseIdFillLesson?page=1&size=999&youdaoCourseId=${classInfo.youdaoCourseId}`
    );
    
    if (response.code === 0 && response.data.list) {
      // 遍历所有课程
      let examLessons = [];
      response.data.list.forEach(course => {
        if (course.lessonList) {
          // 只过滤出examLesson为1的课程
          const examLessonsInCourse = course.lessonList.filter(lesson => lesson.examLesson === 1);
          examLessons = examLessons.concat(examLessonsInCourse);
        }
      });
      
      if (examLessons.length === 0) {
        throw new Error('未找到考试课时信息');
      }
      
      const select = document.getElementById('examLesson');
      select.innerHTML = '';
      
      // 添加课时选项
      examLessons.forEach((lesson, index) => {
        const option = document.createElement('option');
        option.value = lesson.id;
        // 计算当前选项对应的单元范围
        const startUnit = index * 4 + 1;
        const endUnit = (index + 1) * 4;
        option.textContent = `${lesson.title} (第${startUnit}-${endUnit}单元)`;
        if (lesson.id === examLesson) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      
      // 如果没有选中的课时,选中第一个选项
      if (!select.value && examLessons.length > 0) {
        select.value = examLessons[0].id;
        examLesson = parseInt(examLessons[0].id, 10);
        saveCurrentSettings();
      }
      
      // 保存课时列表到全局变量
      lessonList = examLessons;
      
      showStatusMessage('课时列表加载完成', 'success');
    } else {
      throw new Error('获取课时列表失败');
    }
  } catch (error) {
    console.error('加载课时列表失败:', error);
    showStatusMessage('加载课时列表失败: ' + error.message, 'error');
  }
}

// 注册事件处理程序
function registerEventHandlers() {
  // 表单输入事件
  classIdInput.addEventListener('change', async (event) => {
    const newClassId = parseInt(event.target.value, 10);
    if (newClassId !== classId) {
      classId = newClassId;
      // 清空之前的数据
      courseId = null;
      lessonList = [];
      studentReports = {};
      // 清空学生卡片
      if (studentCards) {
        studentCards.innerHTML = '';
      }
      if (bulkActions) {
        bulkActions.classList.add('hidden');
      }
      await saveCurrentSettings();
      // 重新加载课时列表
      await loadLessonList(newClassId);
    }
  });
  
  examLessonInput.addEventListener('change', async (event) => {
    const newExamLesson = parseInt(event.target.value, 10);
    if (newExamLesson !== examLesson) {
      examLesson = newExamLesson;
      // 获取选中的索引
      const selectedIndex = Array.from(examLessonInput.options).findIndex(option => 
        parseInt(option.value) === newExamLesson
      );
      // 更新全局状态
      currentExamIndex = selectedIndex;
      await saveCurrentSettings();
    }
  });
  
  // 截止时间事件
  endTimeInput.addEventListener('change', function() {
    if (this.value) {
      endTime = new Date(this.value).toLocaleString();
      endTimeDate = new Date(endTime);
      saveCurrentSettings();
    }
  });
  
  // API-KEY输入事件
  apiKeyInput.addEventListener('change', async function() {
    apiKey = this.value.trim();
    await saveCurrentSettings();
  });
  
  // 保存知识点计划
  savePlanBtn.addEventListener('click', savePlan);
  
  // 获取报告按钮
  fetchReportsBtn.addEventListener('click', startFetchingReports);
  
  // 批量操作按钮
  generateAllBtn.addEventListener('click', generateAllReports);
  submitAllBtn.addEventListener('click', submitAllReports);
}

// 保存当前设置
async function saveCurrentSettings() {
  await saveSettings({
    classId,
    examLesson,
    endTime,
    apiKey
  });
}

// 保存知识点计划
function savePlan() {
  const planText = planEditor.value.trim();
  
  if (!planText) {
    showStatusMessage('知识点计划不能为空', 'error');
    return;
  }
  
  // 解析每行为一个知识点
  plan = planText.split('\n').filter(line => line.trim());
  
  // 验证格式
  const validFormat = plan.every(line => {
    return /^第\d+单元:.*/.test(line);
  });
  
  if (!validFormat) {
    showStatusMessage('知识点计划格式不正确。格式应为: 第X单元:知识点1,知识点2...', 'error');
    return;
  }
  
  // 保存到存储
  saveSettings({ plan: JSON.stringify(plan) });
  showStatusMessage('知识点计划已保存', 'success');
}

// 显示状态信息
function showStatusMessage(message, type = 'info') {
  const statusContent = statusMessage.querySelector('.status-content');
  
  // 设置消息内容
  statusContent.textContent = message;
  
  // 设置类型样式
  statusMessage.className = `status-fixed ${type}`;
  
  // 显示消息
  statusMessage.classList.remove('hidden');
  
  // 5秒后自动隐藏
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 5000);
}

// 开始获取报告流程
async function startFetchingReports() {
  try {
    // 检查输入
    if (!classId || !examLesson || !endTime) {
      showStatusMessage('请填写所有必需的字段', 'error');
      return;
    }

    // 从存储中重新获取最新的设置
    const settings = await getSettings();
    classId = settings.classId || classId;
    
    // 二次验证classId
    if (!classId) {
      showStatusMessage('班级ID无效，请重新输入', 'error');
      return;
    }
    
    // 更新UI状态
    fetchReportsBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    showStatusMessage('开始获取报告...', 'info');
    
    // 获取班级信息
    await fetchClassInfo();
    
    // 获取课程详情
    await fetchCourseDetails();
    
    // 获取报告数据
    await fetchReportData();
    
    // 完成后更新UI
    fetchReportsBtn.disabled = false;
    progressContainer.classList.add('hidden');
    bulkActions.classList.remove('hidden');
    
    showStatusMessage('报告获取成功！', 'success');
  } catch (error) {
    console.error('获取报告时出错:', error);
    showStatusMessage(`获取报告失败: ${error.message}`, 'error');
    fetchReportsBtn.disabled = false;
  }
}

// 获取班级信息
async function fetchClassInfo() {
  showStatusMessage('正在获取班级信息...', 'info');
  
  try {
    // 增加页面大小到100，确保能获取到所有班级
    const classListData = await apiRequest(
      `https://icodecontest-online-api.youdao.com/api/admin/class/getClassList?page=1&size=100`
    );
    
    // 确保从输入框获取最新的classId
    const currentClassId = parseInt(classIdInput.value, 10);
    
    console.log('当前班级ID:', currentClassId);
    console.log('班级列表:', classListData.data.list.map(c => c.id));
    
    const classInfo = classListData.data.list.find(item => item.id === currentClassId);
    if (!classInfo) {
      throw new Error(`班级ID: ${currentClassId} 未找到`);
    }
    
    // 更新全局变量
    classId = currentClassId;
    
    const youdaoCourseId = classInfo.youdaoCourseId;
    showStatusMessage(`班级ID: ${currentClassId}, 有道课程ID: ${youdaoCourseId}`, 'info');
    
    return youdaoCourseId;
  } catch (error) {
    console.error('获取班级信息失败:', error);
    throw new Error(`获取班级信息失败: ${error.message}`);
  }
}

// 获取课程详情
async function fetchCourseDetails() {
  showStatusMessage('正在获取课程详情...', 'info');
  
  try {
    const youdaoCourseId = await fetchClassInfo();
    
    const courseRes = await apiRequest(
      `https://icodecontest-online-api.youdao.com/api/admin/course/getTuringCoursesByYoudaoCourseIdFillLesson?page=1&size=999&youdaoCourseId=${youdaoCourseId}`
    );
    
    // 遍历所有课程,找到包含当前考试课时的课程
    let targetCourse = null;
    let targetLesson = null;
    
    for (const course of courseRes.data.list) {
      if (course.lessonList) {
        targetLesson = course.lessonList.find(lesson => lesson.id === examLesson);
        if (targetLesson) {
          targetCourse = course;
          break;
        }
      }
    }
    
    if (!targetCourse || !targetLesson) {
      throw new Error('未找到对应的课程或考试课时');
    }
    
    courseId = targetCourse.turingCourseId;
    
    // 获取课时列表 - 考试课时的前三节课
    const allLessons = targetCourse.lessonList;
    const examLessonIndex = allLessons.findIndex(lesson => lesson.id === examLesson);
    
    if (examLessonIndex === -1) {
      throw new Error('未找到考试课时');
    }
    
    // 获取考试课时的前三节课和考试课时本身
    lessonList = allLessons.slice(Math.max(0, examLessonIndex - 3), examLessonIndex + 1);
    
    showStatusMessage(`获取到课程ID: ${courseId}, 需要处理${lessonList.length}个课时`, 'info');
    console.log('课时列表:', lessonList.map(l => ({ id: l.id, title: l.title })));
    
    return { courseId, lessonList };
  } catch (error) {
    console.error('获取课程详情失败:', error);
    throw new Error(`获取课程详情失败: ${error.message}`);
  }
}

// 获取报告数据
async function fetchReportData() {
  showStatusMessage('正在获取学生报告数据...', 'info');
  
  try {
    if (!courseId || !lessonList.length) {
      throw new Error('未获取到课程信息，请先获取课程详情');
    }
    
    const lessonId = lessonList[lessonList.length - 1].id;
    
    // 获取学生列表以获取真实姓名
    const studentListData = await apiRequest(
      `https://icodecontest-online-api.youdao.com/api/admin/class/getStudentList?page=1&size=50&lessonId=${lessonId}&type=1&classId=${classId}`
    );
    
    // 创建学生ID到真实姓名的映射
    const studentNameMap = {};
    studentListData.data.list.forEach(student => {
      // 使用studentUserId作为键，noteName作为值
      studentNameMap[student.userId] = student.noteName;
      console.log('学生ID映射:', student.userId, '->', student.noteName);
    });
    
    const reportData = await apiRequest(
      `https://icodecontest-online-api.youdao.com/api/admin/course/report/reportList?classId=${classId}&turingCourseId=${courseId}&lessonId=${lessonId}&size=50&page=1`
    );
    
    if (!reportData.data || !reportData.data.list.length) {
      throw new Error('未找到学生报告数据');
    }
    
    // 过滤出有状态的学生数据
    const students = reportData.data.list.filter(student => student.status);
    
    if (students.length === 0) {
      throw new Error('未找到有效的学生报告数据');
    }
    
    // 更新进度条
    const total = students.length;
    let current = 0;
    
    // 处理每个学生的数据
    studentReports = {};
    
    await processInParallel(students, async (student) => {
      const studentId = student.studentUserId;
      // 使用真实姓名（备注）替代系统姓名，如果找不到则使用原始名字
      const studentName = studentNameMap[studentId] || student.studentName;
      console.log('获取到学生姓名:', studentId, '->', studentName);
      
      const reportId = student.reportId;
      const normalComment = student.teacherCommentNormal || '';
      const examComment = student.teacherCommentExam || '';
      
      studentReports[studentId] = {
        name: studentName,
        reportId: reportId,
        normal: normalComment,
        exam: examComment,
        evaluations: []
      };
      
      current++;
      showProgress(progressContainer, current, total, '获取学生报告');
      
      return studentId;
    });
    
    console.log('学生报告数据:', studentReports);
    
    // 创建学生卡片
    createStudentCards();
    
    return studentReports;
  } catch (error) {
    console.error('获取报告数据失败:', error);
    throw new Error(`获取报告数据失败: ${error.message}`);
  }
}

// 创建学生卡片
function createStudentCards() {
  // 清空现有卡片
  studentCards.innerHTML = '';
  
  // 获取模板
  const template = document.getElementById('studentCardTemplate');
  
  // 为每个学生创建卡片
  Object.keys(studentReports).forEach(studentId => {
    const student = studentReports[studentId];
    
    // 克隆模板
    const card = template.content.cloneNode(true);
    
    // 设置数据
    const cardElement = card.querySelector('.student-card');
    cardElement.setAttribute('data-student-id', studentId);
    
    const nameElement = card.querySelector('.student-name');
    nameElement.textContent = student.name;
    
    const normalTextarea = card.querySelector('.normal-report');
    normalTextarea.value = student.normal;
    normalTextarea.addEventListener('input', () => {
      studentReports[studentId].normal = normalTextarea.value;
    });
    
    const examTextarea = card.querySelector('.exam-report');
    examTextarea.value = student.exam;
    examTextarea.addEventListener('input', () => {
      studentReports[studentId].exam = examTextarea.value;
    });
    
    // 按钮事件
    const generateBtn = card.querySelector('.generate-btn');
    generateBtn.addEventListener('click', () => generateReport(studentId));
    
    const submitBtn = card.querySelector('.submit-btn');
    submitBtn.addEventListener('click', () => submitReport(studentId));
    
    // 添加到容器
    studentCards.appendChild(card);
  });
}

// 清理HTML和JavaScript代码的函数
function cleanDescription(description) {
  if (!description) return '无题目描述';
  // 移除HTML标签
  description = description.replace(/<[^>]*>/g, '');
  // 移除script标签及其内容
  description = description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // 移除多余的空白字符
  description = description.replace(/\s+/g, ' ').trim();
  return description || '无题目描述';
}

// 获取当前单元范围
function getCurrentUnitRange() {
  const selectedIndex = Array.from(examLessonInput.options).findIndex(option => 
    parseInt(option.value) === examLesson
  );
  return {
    startUnit: selectedIndex * 4 + 1,
    endUnit: (selectedIndex + 1) * 4
  };
}

// 生成报告前检查API-KEY
async function checkApiKey() {
  if (!apiKey) {
    showStatusMessage('请先填写AI API-KEY', 'error');
    return false;
  }
  // 设置全局API-KEY供ai.js使用
  window.apiKey = apiKey;
  return true;
}

// 修改生成报告函数
async function generateReport(studentId) {
  try {
    // 检查API-KEY
    if (!await checkApiKey()) {
      return;
    }
    
    // 获取学生卡片并更新状态
    const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
    const generateBtn = card.querySelector('.generate-btn');
    const normalTextarea = card.querySelector('.normal-report');
    const examTextarea = card.querySelector('.exam-report');
    
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    showStatusMessage(`正在为学生 ${studentReports[studentId].name} 生成报告...`, 'info');
    
    // 获取当前单元范围
    const { startUnit, endUnit } = getCurrentUnitRange();
    
    // 检查lessonList是否有效
    if (!Array.isArray(lessonList) || lessonList.length === 0) {
      throw new Error('课时列表为空，请先获取课时信息');
    }
    
    // 并行获取所有课时的数据
    const lessonDataPromises = lessonList.map(async (lesson, lessonIndex) => {
      const unitNumber = startUnit + lessonIndex;
      
      // 并行获取课堂和作业数据
      const [classData, homeworkData] = await Promise.all([
        apiRequest(
          `https://icodecontest-online-api.youdao.com/api/admin/class/getStudentList?page=1&size=50&lessonId=${lesson.id}&type=1&classId=${classId}`
        ),
        apiRequest(
          `https://icodecontest-online-api.youdao.com/api/admin/class/getStudentList?page=1&size=50&lessonId=${lesson.id}&type=2&classId=${classId}`
        )
      ]);
      
      // 从返回数据中找到当前学生的数据
      const studentClassData = classData.data.list.find(s => s.userId === studentId);
      const studentHomeworkData = homeworkData.data.list.find(s => s.userId === studentId);
      
      // 并行获取课堂练习和作业题目详情
      const [classroomProblemDetails, homeworkProblemDetails] = await Promise.all([
        Promise.all((studentClassData?.problems || []).map(problem => 
          getProblemDetails(problem, lesson.id, studentId)
        )),
        Promise.all((studentHomeworkData?.problems || []).map(problem => 
          getProblemDetails(problem, lesson.id, studentId)
        ))
      ]);
      
      return {
        unitNumber,
        classroomProblemDetails,
        homeworkProblemDetails
      };
    });
    
    // 并行等待所有课时数据
    const lessonDataList = await Promise.all(lessonDataPromises);
    
    // 并行生成所有常规课程评估
    const regularEvaluationPromises = lessonDataList.map(async (lessonData) => {
      if (lessonData.unitNumber >= endUnit) {
        return null;
      }
      
      // 展示当前单元及之前的知识点
      const relevantPlan = plan.slice(0, lessonData.unitNumber);
      const prompt = `这是第${lessonData.unitNumber}单元的表现情况`;
      
      return generateEvaluation(prompt, relevantPlan, {
        classroomProblems: lessonData.classroomProblemDetails,
        homeworkProblems: lessonData.homeworkProblemDetails
      }, studentReports[studentId].name);
    });
    
    // 等待所有评估完成
    const regularEvaluations = (await Promise.all(regularEvaluationPromises)).filter(Boolean);
    
    // 生成考试评估
    let examEvaluation = null;
    if (lessonList.length > 0) {
      const examLessonData = lessonDataList[lessonList.length - 1];
      
      const relevantPlan = plan.slice(0, endUnit);
      const examPrompt = `这是第${endUnit}单元(小测)的表现情况`;
      
      examEvaluation = await generateEvaluation(examPrompt, relevantPlan, {
        classroomProblems: examLessonData.classroomProblemDetails,
        type: 'classroom'
      }, studentReports[studentId].name);
    }
    
    // 生成最终报告
    const report = await generateFinalReport(regularEvaluations, examEvaluation, studentReports[studentId].name);
    
    // 更新文本框
    normalTextarea.value = report.normal;
    studentReports[studentId].normal = report.normal;
    
    if (report.exam) {
      examTextarea.value = report.exam;
      studentReports[studentId].exam = report.exam;
    }
    
    // 恢复按钮状态
    generateBtn.disabled = false;
    generateBtn.textContent = '重新生成';
    showStatusMessage(`学生 ${studentReports[studentId].name} 的报告生成成功！`, 'success');
  } catch (error) {
    console.error(`生成学生 ${studentId} 报告时出错:`, error);
    showStatusMessage(`生成报告失败: ${error.message}`, 'error');
    
    // 恢复按钮状态
    const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
    const generateBtn = card.querySelector('.generate-btn');
    generateBtn.disabled = false;
    generateBtn.textContent = '重新生成';
  }
}

// 提交单个学生报告
async function submitReport(studentId) {
  try {
    const student = studentReports[studentId];
    
    // 获取学生卡片并更新状态
    const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
    const submitBtn = card.querySelector('.submit-btn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    showStatusMessage(`正在提交学生 ${student.name} 的报告...`, 'info');
    
    // 提交报告
    await apiRequest(
      'https://icodecontest-online-api.youdao.com/api/admin/course/report/saveTeacherComment',
      'POST',
      {
        reportId: student.reportId,
        teacherCommentNormal: student.normal,
        teacherCommentExam: student.exam || ''
      }
    );
    
    // 恢复按钮状态
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
    showStatusMessage(`学生 ${student.name} 的报告提交成功！`, 'success');
  } catch (error) {
    console.error(`提交学生 ${studentId} 报告时出错:`, error);
    showStatusMessage(`提交报告失败: ${error.message}`, 'error');
    
    // 恢复按钮状态
    const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
    const submitBtn = card.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
  }
}

// 生成所有报告
async function generateAllReports() {
  try {
    // 检查API-KEY
    if (!await checkApiKey()) {
      return;
    }
    
    const studentIds = Object.keys(studentReports);
    if (studentIds.length === 0) {
      showStatusMessage('没有学生报告数据可生成', 'error');
      return;
    }
    
    // 禁用所有按钮
    generateAllBtn.disabled = true;
    submitAllBtn.disabled = true;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = true;
    });
    
    // 显示进度条
    progressContainer.classList.remove('hidden');
    
    // 获取当前单元范围
    const { startUnit, endUnit } = getCurrentUnitRange();
    
    // 预先获取所有课时的数据
    const lessonDataPromises = lessonList.map(async (lesson) => {
      const [classData, homeworkData] = await Promise.all([
        apiRequest(
          `https://icodecontest-online-api.youdao.com/api/admin/class/getStudentList?page=1&size=50&lessonId=${lesson.id}&type=1&classId=${classId}`
        ),
        apiRequest(
          `https://icodecontest-online-api.youdao.com/api/admin/class/getStudentList?page=1&size=50&lessonId=${lesson.id}&type=2&classId=${classId}`
        )
      ]);
      return { lesson, classData, homeworkData };
    });
    
    // 并行获取所有课时数据
    const lessonDataList = await Promise.all(lessonDataPromises);
    
    // 更新进度条
    const total = studentIds.length;
    let current = 0;
    
    // 并行处理每个学生的报告
    await processInParallel(studentIds, async (studentId) => {
      try {
        // 生成常规课程评估
        const regularEvaluations = [];
        
        // 并行处理每个单元的评估
        const unitEvaluations = await Promise.all(
          Array.from({ length: endUnit - startUnit }, async (_, index) => {
            const unitNumber = startUnit + index;
            const lessonIndex = index;
            
            if (lessonIndex >= lessonList.length) {
              return null;
            }
            
            const lessonData = lessonDataList[lessonIndex];
            if (!lessonData) {
              return null;
            }
            
            // 从预先获取的数据中找到当前学生的数据
            const studentClassData = lessonData.classData.data.list.find(s => s.userId === studentId);
            const studentHomeworkData = lessonData.homeworkData.data.list.find(s => s.userId === studentId);
            
            // 并行获取课堂练习和作业题目详情
            const [classroomProblemDetails, homeworkProblemDetails] = await Promise.all([
              Promise.all((studentClassData?.problems || []).map(problem => 
                getProblemDetails(problem, lessonData.lesson.id, studentId)
              )),
              Promise.all((studentHomeworkData?.problems || []).map(problem => 
                getProblemDetails(problem, lessonData.lesson.id, studentId)
              ))
            ]);
            
            // 展示当前单元及之前的知识点
            const relevantPlan = plan.slice(0, unitNumber);
            const prompt = `这是第${unitNumber}单元的表现情况`;
            
            return generateEvaluation(prompt, relevantPlan, {
              classroomProblems: classroomProblemDetails,
              homeworkProblems: homeworkProblemDetails
            }, studentReports[studentId].name);
          })
        );
        
        // 过滤掉空值并添加到常规评估中
        regularEvaluations.push(...unitEvaluations.filter(Boolean));
        
        // 生成考试评估
        let examEvaluation = null;
        if (lessonList.length > 0) {
          const examLessonData = lessonDataList[lessonList.length - 1];
          const studentExamData = examLessonData.classData.data.list.find(s => s.userId === studentId);
          
          // 并行获取考试题目详情
          const examProblemDetails = await Promise.all(
            (studentExamData?.problems || []).map(problem => 
              getProblemDetails(problem, examLessonData.lesson.id, studentId)
            )
          );
          
          const relevantPlan = plan.slice(0, endUnit);
          const examPrompt = `这是第${endUnit}单元(小测)的表现情况`;
          
          examEvaluation = await generateEvaluation(examPrompt, relevantPlan, {
            classroomProblems: examProblemDetails,
            type: 'classroom'
          }, studentReports[studentId].name);
        }
        
        // 生成最终报告
        const report = await generateFinalReport(regularEvaluations, examEvaluation, studentReports[studentId].name);
        
        // 更新报告内容
        const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
        const normalTextarea = card.querySelector('.normal-report');
        const examTextarea = card.querySelector('.exam-report');
        
        normalTextarea.value = report.normal;
        studentReports[studentId].normal = report.normal;
        
        if (report.exam) {
          examTextarea.value = report.exam;
          studentReports[studentId].exam = report.exam;
        }
        
        // 更新进度
        current++;
        showProgress(progressContainer, current, total, '生成报告');
      } catch (error) {
        console.error(`生成学生 ${studentId} 报告时出错:`, error);
      }
    }, 25); // 一次处理25个学生
    
    // 恢复按钮状态
    generateAllBtn.disabled = false;
    submitAllBtn.disabled = false;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = false;
    });
    
    // 隐藏进度条
    progressContainer.classList.add('hidden');
    
    showStatusMessage('所有学生报告已生成完成！', 'success');
  } catch (error) {
    console.error('生成所有报告时出错:', error);
    showStatusMessage(`生成报告失败: ${error.message}`, 'error');
    
    // 恢复按钮状态
    generateAllBtn.disabled = false;
    submitAllBtn.disabled = false;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = false;
    });
  }
}

// 获取题目详情的辅助函数
async function getProblemDetails(problem, lessonId, studentId) {
  try {
    const [detail, submissions] = await Promise.all([
      apiRequest(
        'https://icodecontest-online-api.youdao.com/api/course/lesson/problem/detail',
        'POST',
        {
          courseId: courseId,
          problemId: problem.problemId,
          lessonId: lessonId,
          lessonProblemType: problem.lessonProblemType,
          studentUserId: studentId
        }
      ),
      apiRequest(
        'https://icodecontest-online-api.youdao.com/api/course/lesson/problem/mySubmission',
        'POST',
        {
          page: 1,
          size: 20,
          courseId: courseId,
          lessonId: lessonId,
          problemId: problem.problemId,
          language: 'C++',
          lessonProblemType: problem.lessonProblemType,
          studentUserId: studentId
        }
      )
    ]);
    
    // 过滤截止时间前的提交
    const validSubmissions = submissions.data.list.filter(
      item => new Date(item.submitTime) <= endTimeDate
    );
    
    // 获取最后一次提交的代码
    const lastSubmission = validSubmissions[0];
    const submissionCode = lastSubmission ? lastSubmission.code : '未作答';
    
    return {
      title: detail.data.title || '未知题目',
      description: cleanDescription(detail.data.description),
      code: submissionCode,
      status: validSubmissions.length > 0 && validSubmissions[0].status === 'Accepted' ? 1 : 0
    };
  } catch (error) {
    console.error('获取题目详情失败:', error);
    return {
      title: '获取题目失败',
      description: '无法获取题目描述',
      code: '未作答',
      status: 0
    };
  }
}

// 提交所有报告
async function submitAllReports() {
  try {
    const studentIds = Object.keys(studentReports);
    if (studentIds.length === 0) {
      showStatusMessage('没有学生报告数据可提交', 'error');
      return;
    }
    
    // 禁用所有按钮
    generateAllBtn.disabled = true;
    submitAllBtn.disabled = true;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = true;
    });
    
    // 显示进度条
    progressContainer.classList.remove('hidden');
    
    // 更新进度条
    const total = studentIds.length;
    let current = 0;
    
    // 并行处理每个学生的报告
    await processInParallel(studentIds, async (studentId) => {
      try {
        const student = studentReports[studentId];
        
        // 提交报告
        await apiRequest(
          'https://icodecontest-online-api.youdao.com/api/admin/course/report/saveTeacherComment',
          'POST',
          {
            reportId: student.reportId,
            teacherCommentNormal: student.normal,
            teacherCommentExam: student.exam || ''
          }
        );
        
        // 更新进度
        current++;
        showProgress(progressContainer, current, total, '提交报告');
      } catch (error) {
        console.error(`提交学生 ${studentId} 报告时出错:`, error);
      }
    }, 25); // 一次处理25个学生
    
    // 恢复按钮状态
    generateAllBtn.disabled = false;
    submitAllBtn.disabled = false;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = false;
    });
    
    // 隐藏进度条
    progressContainer.classList.add('hidden');
    
    showStatusMessage('所有学生报告已提交完成！', 'success');
  } catch (error) {
    console.error('提交所有报告时出错:', error);
    showStatusMessage(`提交报告失败: ${error.message}`, 'error');
    
    // 恢复按钮状态
    generateAllBtn.disabled = false;
    submitAllBtn.disabled = false;
    document.querySelectorAll('.student-card button').forEach(btn => {
      btn.disabled = false;
    });
  }
} 