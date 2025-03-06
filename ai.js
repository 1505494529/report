import { apiRequest } from './utils.js';

// 调用AI API进行问答
async function askAI(question) {
  try {
    // 从全局变量获取API-KEY
    const apiKey = window.apiKey;
    if (!apiKey) {
      throw new Error('未设置API-KEY');
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: question }
        ],
        model: 'doubao-pro-32k-241215',
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || "无法获取AI回答";
  } catch (error) {
    console.error("AI请求出错:", error);
    return `AI请求出错: ${error.message}`;
  }
}

// 生成评估
async function generateEvaluation(prompt, plan, lessonData, studentName = '') {
  // 处理学生姓名
  let lastName = studentName;
  if (studentName) {
    // 检查是否是中文名字（使用Unicode范围判断）
    const isChinese = /^[\u4e00-\u9fa5]+$/.test(studentName);
    if (isChinese) {
      // 如果是中文名字，取最后两个字
      lastName = studentName.length >= 2 ? studentName.slice(-2) : studentName;
    }
  }
  
  // 格式化问题数据
  let classroomText = '';
  let homeworkText = '';
  
  // 检查lessonData是否存在且有效
  if (lessonData) {
    // 处理课堂练习
    if (Array.isArray(lessonData.classroomProblems) && lessonData.classroomProblems.length > 0) {
      lessonData.classroomProblems.forEach((problem, index) => {
        // 检查problem对象是否有效，提取title, description, code和status
        const title = problem.title || '未知题目';
        const description = problem.description || '无题目描述';
        const code = problem.code || '未作答';
        const status = problem.status ? '正确' : (code !== '未作答' ? '错误' : '未作答');
        
        classroomText += `问题${index + 1}:${title}\n`;
        classroomText += `题目描述:${description}\n`;
        classroomText += `回答${index + 1}:\n${code}\n`;
        classroomText += `状态${index + 1}:${status}\n\n`;
      });
    }
    
    // 处理课后作业
    if (Array.isArray(lessonData.homeworkProblems) && lessonData.homeworkProblems.length > 0) {
      lessonData.homeworkProblems.forEach((problem, index) => {
        // 检查problem对象是否有效，提取title, description, code和status
        const title = problem.title || '未知题目';
        const description = problem.description || '无题目描述';
        const code = problem.code || '未作答';
        const status = problem.status ? '正确' : (code !== '未作答' ? '错误' : '未作答');
        
        homeworkText += `问题${index + 1}:${title}\n`;
        homeworkText += `题目描述:${description}\n`;
        homeworkText += `回答${index + 1}:\n${code}\n`;
        homeworkText += `状态${index + 1}:${status}\n\n`;
      });
    }
    
    // 处理旧格式的问题数据兼容
    if (Array.isArray(lessonData.problems) && lessonData.problems.length > 0 && !classroomText && !homeworkText) {
      let problemsText = '';
      lessonData.problems.forEach((problem, index) => {
        // 检查problem对象是否有效，提取title, description, code和status
        const title = problem.title || '未知题目';
        const description = problem.description || '无题目描述';
        const code = problem.code || '未作答';
        const status = problem.status ? '正确' : (code !== '未作答' ? '错误' : '未作答');
        
        problemsText += `问题${index + 1}:${title}\n`;
        problemsText += `题目描述:${description}\n`;
        problemsText += `回答${index + 1}:\n${code}\n`;
        problemsText += `状态${index + 1}:${status}\n\n`;
      });
      
      if (problemsText) {
        if (lessonData.type === 'classroom') {
          classroomText = problemsText;
        } else if (lessonData.type === 'homework') {
          homeworkText = problemsText;
        } else {
          // 如果没有指定类型，默认归为课堂练习
          classroomText = problemsText;
        }
      }
    }
  }
  
  // 检查prompt中是否已经包含了问题数据，如果是则直接使用
  if (prompt.includes('问题') && prompt.includes('回答') && prompt.includes('状态')) {
    // prompt已经包含问题数据，直接使用
    const finalPrompt = `${prompt}\n请客观评价一下这位同学这节课的表现,100字左右即可。\n`;
    return askAI(finalPrompt);
  } else {
    // 构建完整提示，分别评价课堂练习和课后作业
    let finalPrompt = `下面是目前学过的知识点:\n${plan.join('\n')}\n\n${prompt}\n\n`;
    
    if (classroomText) {
      finalPrompt += `【课堂练习情况】\n${classroomText}\n`;
    }
    
    if (homeworkText) {
      finalPrompt += `【课后作业情况】\n${homeworkText}\n`;
    }
    
    const nameStr = lastName ? `(${lastName}同学)` : '';
    finalPrompt += `请客观评价一下这位同学${nameStr}这节课的表现,需要分别评价课堂练习和课后作业情况(如有),评价总共100字左右即可。\n`;
    return askAI(finalPrompt);
  }
}

// 生成最终报告
async function generateFinalReport(regularEvaluations, examEvaluation = null, studentName = '') {
  // 处理学生姓名
  let lastName = studentName;
  if (studentName) {
    // 检查是否是中文名字
    const isChinese = /^[\u4e00-\u9fa5]+$/.test(studentName);
    if (isChinese) {
      // 如果是中文名字，取最后两个字
      lastName = studentName.length >= 2 ? studentName.slice(-2) : studentName;
    }
  }

  const nameStr = lastName ? `(${lastName}同学)` : '';
  const normalPrompt = `以下为该同学${nameStr}每节课收到的评价：\n${regularEvaluations.join('\n')}\n根据这些内容，整理成100字左右的平时表现评价。`;
  
  const normalResponse = await askAI(normalPrompt);
  
  if (!examEvaluation) {
    return { normal: normalResponse };
  }
  
  const examPrompt = `以下为该同学${nameStr}的平时表现情况：${normalResponse}\n以下为该同学的本次测评情况：\n${examEvaluation}\n请根据上述信息，对本次测评做出评价，100字左右即可。`;
  
  const examResponse = await askAI(examPrompt);
  
  return {
    normal: normalResponse,
    exam: examResponse
  };
}

export { askAI, generateEvaluation, generateFinalReport }; 