// lib/ai-service.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In lib/ai-service.js - Fix the question generation to clean options

export async function generatePersonalizedQuestions({ 
  type, 
  count, 
  difficulty, 
  topic,
  internProfile
}) {
  const skillsList = internProfile?.skills?.length 
    ? internProfile.skills.join(', ') 
    : 'general programming';
  
  const experienceLevel = internProfile?.experience_level || 'intermediate';
  const department = internProfile?.department?.name || '';
  const position = internProfile?.position_title || '';
  
  const previousEval = internProfile?.evaluations?.[0];
  const previousScore = previousEval?.technical_skill_score || '';
  
  const prompt = `Generate ${count} personalized ${type} questions for a technical assessment.

INTERN PROFILE:
- Department: ${department}
- Position: ${position}
- Skills: ${skillsList}
- Experience Level: ${experienceLevel}
- Previous Technical Score: ${previousScore}/10

Difficulty Level: ${difficulty}
${topic ? `Specific Topic: ${topic}` : 'Topic: Based on intern\'s skills and department'}

IMPORTANT FORMATTING RULES:
1. For MCQ questions, provide options as a JSON object with keys "a", "b", "c", "d" and values as CLEAN STRINGS without quotes inside
2. Example of CORRECT format: {"a": "Option A text", "b": "Option B text", "c": "Option C text", "d": "Option D text"}
3. Do NOT include backslashes or escaped quotes in the option values
4. Keep option text concise and clear

Return as JSON array where each question has:
- question_text (string)
- type (string: "mcq", "coding", or "descriptive")
- difficulty (string: "easy", "medium", or "hard")
- points (number: 10, 15, or 20)
- For MCQ: options (object with a,b,c,d keys)
- For MCQ: correct_answer (string: "a", "b", "c", or "d")
- For coding: expected_output (string)
- For descriptive: rubric (string)

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  // Clean the content - remove any markdown code blocks
  let cleanContent = content;
  if (content.startsWith('```json')) {
    cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (content.startsWith('```')) {
    cleanContent = content.replace(/```\n?/g, '');
  }
  
  const questions = JSON.parse(cleanContent);
  
  return questions.map((q, i) => {
    // Clean options if it's an MCQ
    let cleanedOptions = q.options;
    if (q.type === 'mcq' && q.options) {
      // If options is a string, parse it
      if (typeof q.options === 'string') {
        try {
          cleanedOptions = JSON.parse(q.options);
        } catch (e) {
          console.error('Failed to parse options:', e);
          cleanedOptions = {};
        }
      }
      
      // Clean each option value
      if (cleanedOptions && typeof cleanedOptions === 'object') {
        Object.keys(cleanedOptions).forEach(key => {
          if (typeof cleanedOptions[key] === 'string') {
            // Remove any quotes and clean up
            cleanedOptions[key] = cleanedOptions[key].replace(/^["']|["']$/g, '').trim();
          }
        });
      }
    }
    
    return {
      text: q.question_text,
      type: q.type,
      difficulty: q.difficulty,
      points: q.points || (q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 15 : 20),
      options: cleanedOptions,
      correct_answer: q.correct_answer,
      expected_output: q.expected_output,
      rubric: q.rubric
    };
  });
}

// Keep original for backward compatibility
export async function generateQuestions({ type, count, difficulty, topic }) {
  const prompt = `Generate ${count} ${type} questions for a technical assessment.
  Difficulty: ${difficulty}
  Topic: ${topic || 'general programming concepts'}
  
  For each question, provide:
  - question_text
  - type (mcq/coding/descriptive)
  - difficulty (easy/medium/hard)
  - points (10 for easy, 15 for medium, 20 for hard)
  - For MCQ: provide 4 options (a, b, c, d) and correct answer
  - For coding: provide expected output and grading rubric
  - For descriptive: provide grading rubric
  
  Return as JSON array.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  const questions = JSON.parse(content);
  
  return questions.map((q, i) => ({
    text: q.question_text,
    type: q.type,
    difficulty: q.difficulty,
    points: q.points || (q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 15 : 20),
    options: q.options,
    correct_answer: q.correct_answer,
    expected_output: q.expected_output,
    rubric: q.rubric
  }));
}

export async function evaluateAnswers(questions, responses) {
  const responseMap = new Map();
  responses.forEach(r => {
    responseMap.set(r.question_id, r.intern_response);
  });

  const evaluationItems = [];
  
  for (const question of questions) {
    const answer = responseMap.get(question.id);
    
    const prompt = `Evaluate this answer:
    
    Question: ${question.question_text}
    Type: ${question.question_type}
    Max Points: ${question.points}
    
    ${question.question_type === 'mcq' ? `Correct Answer: ${question.correct_answer}` : ''}
    ${question.question_type === 'coding' ? `Expected Output: ${question.expected_output}` : ''}
    ${question.rubric ? `Rubric: ${question.rubric}` : ''}
    
    Student's Answer: ${answer || '[No answer provided]'}
    
    Provide:
    1. Points awarded (0-${question.points})
    2. Brief feedback (2-3 sentences) - be constructive and specific
    
    Format as JSON: {"points": number, "feedback": "string"}`;

    const evaluation = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const result = JSON.parse(evaluation.choices[0].message.content);
    
    evaluationItems.push({
      question_id: question.id,
      question_number: question.question_number,
      question_text: question.question_text,
      answer: answer || '',
      points: question.points,
      obtained_points: result.points,
      feedback: result.feedback
    });
  }

  const totalPoints = evaluationItems.reduce((sum, i) => sum + i.points, 0);
  const obtainedPoints = evaluationItems.reduce((sum, i) => sum + i.obtained_points, 0);
  const percentage = (obtainedPoints / totalPoints) * 100;

  // Generate overall feedback
  const overallPrompt = `Based on the following test results, provide constructive feedback:
  
  Overall Score: ${percentage}%
  Grade: ${percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
  
  Individual Results:
  ${evaluationItems.map(i => `Question ${i.question_number}: ${i.obtained_points}/${i.points} - ${i.feedback}`).join('\n')}
  
  Provide a concise overall feedback (3-4 sentences) highlighting strengths and areas for improvement.`;

  const overallResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: overallPrompt }],
    temperature: 0.5,
  });

  return {
    overall_feedback: overallResponse.choices[0].message.content,
    results: evaluationItems,
    total_points: totalPoints,
    obtained_points: obtainedPoints,
    percentage
  };
}