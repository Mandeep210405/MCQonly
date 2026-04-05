// import OpenAI from 'openai';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Generate MCQ-only personalized questions based on intern profile
// export async function generatePersonalizedQuestions({ count, difficulty, internProfile }) {
//   const skills     = internProfile?.skills?.length ? internProfile.skills.join(', ') : 'general programming';
//   const level      = internProfile?.experience_level || 'intermediate';
//   const department = internProfile?.department?.name || '';
//   const position   = internProfile?.position_title || '';

//   const prompt = `Generate ${count} MCQ questions for a technical assessment.

// INTERN PROFILE:
// - Department: ${department}
// - Position: ${position}
// - Skills: ${skills}
// - Experience Level: ${level}
// Difficulty: ${difficulty}

// RULES:
// 1. Return ONLY a JSON array, no markdown, no extra text
// 2. Every question must be MCQ
// 3. options must be a JSON object with keys "a", "b", "c", "d" — values are plain strings, no quotes inside
// 4. correct_answer must be "a", "b", "c", or "d"
// 5. points = 10 for all questions

// Example format:
// [
//   {
//     "question_text": "What does HTML stand for?",
//     "difficulty": "easy",
//     "options": {"a": "Hyper Text Markup Language", "b": "High Text Markup Language", "c": "Hyper Transfer Markup Language", "d": "None of these"},
//     "correct_answer": "a",
//     "points": 10
//   }
// ]`;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.7,
//   });

//   // Strip markdown fences if present
//   let content = response.choices[0].message.content.trim();
//   content = content.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();

//   const questions = JSON.parse(content);

//   return questions.map(q => {
//     // Clean option values (remove stray quotes)
//     const options = {};
//     if (q.options && typeof q.options === 'object') {
//       for (const key of ['a', 'b', 'c', 'd']) {
//         options[key] = String(q.options[key] || '').replace(/^['"]+|['"]+$/g, '').trim();
//       }
//     }

//     return {
//       text:           q.question_text,
//       difficulty:     q.difficulty || difficulty,
//       options,
//       correct_answer: q.correct_answer,
//       points:         q.points || 10,
//       // type, expected_output, rubric removed — MCQ only
//     };
//   });
// }

// FILE: frontend/lib/ai-service.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Generate MCQ-only personalized questions based on intern profile
export async function generatePersonalizedQuestions({ count, difficulty, internProfile }) {
  const skills     = internProfile?.skills?.length ? internProfile.skills.join(', ') : 'general programming';
  const level      = internProfile?.experience_level || 'intermediate';
  const department = internProfile?.department?.name || '';
  const position   = internProfile?.position_title || '';

  const prompt = `Generate ${count} MCQ questions for a technical assessment.

INTERN PROFILE:
- Department: ${department}
- Position: ${position}
- Skills: ${skills}
- Experience Level: ${level}
Difficulty: ${difficulty}

RULES:
1. Return ONLY a JSON array, no markdown, no extra text
2. Every question must be MCQ
3. options must be a JSON object with keys "a", "b", "c", "d" — values are plain strings, no quotes inside
4. correct_answer must be "a", "b", "c", or "d"
5. points = 10 for all questions

Example format:
[
  {
    "question_text": "What does HTML stand for?",
    "difficulty": "easy",
    "options": {"a": "Hyper Text Markup Language", "b": "High Text Markup Language", "c": "Hyper Transfer Markup Language", "d": "None of these"},
    "correct_answer": "a",
    "points": 10
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  let content = response.choices[0].message.content.trim();
  content = content.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();

  const questions = JSON.parse(content);

  return questions.map(q => {
    const options = {};
    if (q.options && typeof q.options === 'object') {
      for (const key of ['a', 'b', 'c', 'd']) {
        options[key] = String(q.options[key] || '').replace(/^['"]+|['"]+$/g, '').trim();
      }
    }

    return {
      text:           q.question_text,
      difficulty:     q.difficulty || difficulty,
      options,
      correct_answer: q.correct_answer,
      points:         q.points || 10,
    };
  });
}