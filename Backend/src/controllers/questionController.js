const csv = require('csv-parse');
const mammoth = require('mammoth');
const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

// Helper: map a DB question row to the API response shape
const questionToResponse = (q) => ({
  _id: q.id,
  projectId: q.projectId,
  field1: q.field1,
  field2: q.field2,
  field3: q.field3,
  optionA: q.optionA,
  optionB: q.optionB,
  optionC: q.optionC,
  optionD: q.optionD,
  correctAnswer: q.correctAnswer,
  hint: q.hint,
  difficulty: q.difficulty || 'medium',
  category: q.category || '',
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

// @desc    List questions for a project
// @route   GET /api/projects/:id/questions
// @access  Private
const getQuestions = async (req, res) => {
  const { search = '', difficulty = '', category = '' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const where = { projectId: project.id };
  if (search) {
    where.field1 = { contains: search };
  }
  if (difficulty && difficulty !== 'all') {
    where.difficulty = difficulty;
  }
  if (category && category !== 'all') {
    where.category = category;
  }

  const total = await prisma.question.count({ where });
  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json({ questions: questions.map(questionToResponse), total, page, limit });
};

// @desc    Add single question
// @route   POST /api/projects/:id/questions
// @access  Private
const addQuestion = async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const { field1, field2, field3, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category } = req.body;

  if (project.projectType === 'mcq') {
    if (!field1 || !String(field1).trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    if (!optionA || !optionB || !optionC || !optionD) {
      return res.status(400).json({ message: 'All four options are required' });
    }
    if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ message: 'Correct answer must be A, B, C, or D' });
    }
  } else {
    if (!field1 || !String(field1).trim()) {
      return res.status(400).json({ message: 'Field 1 is required' });
    }
  }

  const question = await prisma.question.create({
    data: {
      projectId: project.id,
      field1: String(field1 || '').trim(),
      field2: String(field2 || '').trim(),
      field3: String(field3 || '').trim(),
      optionA: String(optionA || '').trim(),
      optionB: String(optionB || '').trim(),
      optionC: String(optionC || '').trim(),
      optionD: String(optionD || '').trim(),
      correctAnswer: correctAnswer || '',
      hint: String(hint || field3 || '').trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      category: String(category || '').trim(),
    },
  });
  res.status(201).json(questionToResponse(question));
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = async (req, res) => {
  const question = await prisma.question.findUnique({ where: { id: Number(req.params.id) } });
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  const { field1, field2, field3, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category } = req.body;
  const updateData = {};

  if (field1 !== undefined) {
    if (!String(field1).trim()) {
      return res.status(400).json({ message: 'Field 1 is required' });
    }
    updateData.field1 = String(field1).trim();
  }
  if (field2 !== undefined) updateData.field2 = String(field2).trim();
  if (field3 !== undefined) updateData.field3 = String(field3).trim();
  if (optionA !== undefined) updateData.optionA = String(optionA).trim();
  if (optionB !== undefined) updateData.optionB = String(optionB).trim();
  if (optionC !== undefined) updateData.optionC = String(optionC).trim();
  if (optionD !== undefined) updateData.optionD = String(optionD).trim();
  if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
  if (hint !== undefined) updateData.hint = String(hint).trim();
  if (difficulty !== undefined) {
    updateData.difficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
  }
  if (category !== undefined) {
    updateData.category = String(category).trim();
  }

  const updated = await prisma.question.update({
    where: { id: question.id },
    data: updateData,
  });
  res.json(questionToResponse(updated));
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = async (req, res) => {
  const question = await prisma.question.findUnique({ where: { id: Number(req.params.id) } });
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  await prisma.question.delete({ where: { id: question.id } });
  res.json({ message: 'Question removed' });
};

// @desc    Upload CSV/DOCX and bulk insert
// @route   POST /api/projects/:id/questions/upload
// @access  Private
const uploadQuestions = async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const isMcq = project.projectType === 'mcq';
  const { mapping } = req.body; // e.g. column index mapping
  let rows = [];

  try {
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      rows = await parseCsv(req.file.buffer);
    } else if (
      req.file.mimetype.includes('word') ||
      req.file.originalname.endsWith('.docx')
    ) {
      rows = await parseDocx(req.file.buffer, isMcq);
    } else {
      return res.status(400).json({ message: 'Unsupported file type. Upload CSV or DOCX.' });
    }
  } catch (err) {
    return res.status(400).json({ message: `Failed to parse file: ${err.message}` });
  }

  if (rows.length === 0) {
    return res.status(400).json({ message: 'No data rows found in file' });
  }

  // If mapping not provided, auto-detect columns
  let colMap;
  if (isMcq) {
    colMap = {
      field1: 0, optionA: 1, optionB: 2, optionC: 3, optionD: 4, correctAnswer: 5, hint: 6,
    };
    if (mapping) {
      colMap = {
        field1: mapping.field1 !== undefined ? Number(mapping.field1) : 0,
        optionA: mapping.optionA !== undefined ? Number(mapping.optionA) : 1,
        optionB: mapping.optionB !== undefined ? Number(mapping.optionB) : 2,
        optionC: mapping.optionC !== undefined ? Number(mapping.optionC) : 3,
        optionD: mapping.optionD !== undefined ? Number(mapping.optionD) : 4,
        correctAnswer: mapping.correctAnswer !== undefined ? Number(mapping.correctAnswer) : 5,
        hint: mapping.hint !== undefined ? Number(mapping.hint) : 6,
      };
    }
  } else {
    colMap = { field1: 0, field2: 1, field3: 2 };
    if (mapping) {
      colMap = {
        field1: mapping.field1 !== undefined ? Number(mapping.field1) : 0,
        field2: mapping.field2 !== undefined ? Number(mapping.field2) : 1,
        field3: mapping.field3 !== undefined ? Number(mapping.field3) : 2,
      };
    }
  }

  const docs = [];
  let skipped = 0;
  for (const row of rows) {
    const f1 = (row[colMap.field1] || '').toString().trim();
    if (!f1) {
      skipped++;
      continue;
    }
    if (isMcq) {
      docs.push({
        projectId: project.id,
        field1: f1,
        optionA: (row[colMap.optionA] || '').toString().trim(),
        optionB: (row[colMap.optionB] || '').toString().trim(),
        optionC: (row[colMap.optionC] || '').toString().trim(),
        optionD: (row[colMap.optionD] || '').toString().trim(),
        correctAnswer: (row[colMap.correctAnswer] || '').toString().trim().toUpperCase(),
        hint: (row[colMap.hint] || '').toString().trim(),
      });
    } else {
      docs.push({
        projectId: project.id,
        field1: f1,
        field2: (row[colMap.field2] || '').toString().trim(),
        field3: (row[colMap.field3] || '').toString().trim(),
        hint: (row[colMap.field3] || '').toString().trim(),
      });
    }
  }

  if (docs.length === 0) {
    return res.status(400).json({ message: 'No valid rows with question present' });
  }

  const result = await prisma.question.createMany({ data: docs });
  res.status(201).json({
    inserted: result.count,
    skipped,
    total: rows.length,
  });
};

const parseCsv = (buffer) => {
  return new Promise((resolve, reject) => {
    csv.parse(buffer, { columns: false, trim: true, skip_empty_lines: true }, (err, records) => {
      if (err) return reject(err);
      // Drop header row if first row looks like a header (contains non-data text)
      let data = records;
      if (data.length > 0) {
        const first = data[0].map((c) => (c || '').toString().toLowerCase());
        const looksLikeHeader =
          first.some((c) => ['word', 'definition', 'hint', 'question', 'answer', 'field1', 'field2', 'field3', 'option a', 'opt a'].includes(c)) &&
          !first.some((c) => /^[a-z0-9\s]{2,}$/i.test(c) && !['word', 'definition', 'hint', 'question', 'answer', 'field1', 'field2', 'field3', 'option a', 'opt a'].includes(c));
        if (looksLikeHeader) {
          data = data.slice(1);
        }
      }
      resolve(data);
    });
  });
};

const parseDocx = async (buffer, isMcq = false) => {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // 1. Table or TSV / Pipe format check
  const hasTabs = lines.some((l) => l.includes('\t'));
  const hasPipes = lines.some((l) => l.includes('|'));

  if (hasTabs) {
    return lines.map((l) => l.split('\t').map((c) => c.trim()));
  }
  if (hasPipes) {
    return lines.map((l) => l.split('|').map((c) => c.trim()));
  }

  // 2. If it's an MCQ project, parse block quiz formats with Hint support:
  // e.g.:
  // 1. What is the question?
  // A) Option A
  // B) Option B
  // C) Option C
  // D) Option D
  // Hint: Optional clue
  // Answer: D
  if (isMcq) {
    const questions = [];
    let currentQ = null;

    const optRegex = /^(\(?\s*([A-D])\s*[\)\.\:\-]|(?:Option|Opt)\s*([A-D])[\:\.\-]?)\s*(.*)/i;
    const ansRegex = /^(?:Ans(?:wer)?|Correct(?:\s*Ans(?:wer)?)?|Key|Right\s*Ans(?:wer)?)[\:\.\-\s]+(.*)/i;
    const hintRegex = /^(?:Hint|Clue)[\:\.\-\s]+(.*)/i;
    const qNumRegex = /^(?:Q(?:uestion)?\s*\d*[\:\.\-]?|\d+[\.\)\:\-])\s*(.*)/i;

    const finalizeCurrent = () => {
      if (currentQ && currentQ.field1) {
        // If answer was written as option text instead of letter, match it
        let answerLetter = (currentQ.correctAnswer || '').trim().toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(answerLetter)) {
          const ansText = (currentQ.correctAnswer || '').toLowerCase().trim();
          if (ansText) {
            if (ansText === (currentQ.optionA || '').toLowerCase().trim()) answerLetter = 'A';
            else if (ansText === (currentQ.optionB || '').toLowerCase().trim()) answerLetter = 'B';
            else if (ansText === (currentQ.optionC || '').toLowerCase().trim()) answerLetter = 'C';
            else if (ansText === (currentQ.optionD || '').toLowerCase().trim()) answerLetter = 'D';
            else {
              const matchLetter = ansText.match(/\b([a-d])\b/i);
              if (matchLetter) answerLetter = matchLetter[1].toUpperCase();
            }
          }
        }

        questions.push([
          currentQ.field1,
          currentQ.optionA || '',
          currentQ.optionB || '',
          currentQ.optionC || '',
          currentQ.optionD || '',
          answerLetter || 'A',
          currentQ.hint || '',
        ]);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const ansMatch = line.match(ansRegex);
      const hintMatch = line.match(hintRegex);
      const optMatch = line.match(optRegex);
      const qMatch = line.match(qNumRegex);

      if (ansMatch && currentQ) {
        currentQ.correctAnswer = ansMatch[1].trim();
      } else if (hintMatch && currentQ) {
        currentQ.hint = hintMatch[1].trim();
      } else if (optMatch) {
        if (!currentQ) {
          currentQ = { field1: 'Question', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', hint: '' };
        }
        const letter = (optMatch[2] || optMatch[3] || '').toUpperCase();
        const optText = optMatch[4] ? optMatch[4].trim() : '';
        if (letter === 'A') currentQ.optionA = optText;
        else if (letter === 'B') currentQ.optionB = optText;
        else if (letter === 'C') currentQ.optionC = optText;
        else if (letter === 'D') currentQ.optionD = optText;
      } else if (qMatch) {
        finalizeCurrent();
        currentQ = {
          field1: qMatch[1].trim() || line,
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: '',
          hint: '',
        };
      } else {
        // If currentQ already has all options and an answer, this must be a new question
        if (currentQ && currentQ.optionD && (currentQ.correctAnswer || currentQ.optionA)) {
          finalizeCurrent();
          currentQ = {
            field1: line,
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: '',
            hint: '',
          };
        } else if (!currentQ) {
          currentQ = {
            field1: line,
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: '',
            hint: '',
          };
        } else if (!currentQ.optionA) {
          currentQ.field1 += ' ' + line;
        }
      }
    }

    finalizeCurrent();

    if (questions.length > 0) {
      return questions;
    }
  }

  // Fallback for classic projects (e.g. "Word - Definition" or "Word: Definition")
  return lines.map((l) => {
    const parts = l.split(/\s+[-–—:]\s+/);
    if (parts.length >= 2) {
      return parts;
    }
    return [l];
  });
};

// @desc    Get recent questions across all projects
// @route   GET /api/questions/recent
// @access  Private
const getRecentQuestions = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      project: {
        select: { name: true, fieldLabelField1: true, fieldLabelField2: true, fieldLabelField3: true, projectType: true },
      },
    },
  });
  const result = questions.map((q) => ({
    _id: q.id,
    field1: q.field1,
    field2: q.field2,
    field3: q.field3,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    projectName: q.project?.name || 'Unknown',
    projectType: q.project?.projectType || 'classic',
    fieldLabels: {
      field1: q.project?.fieldLabelField1 || 'Field 1',
      field2: q.project?.fieldLabelField2 || 'Field 2',
      field3: q.project?.fieldLabelField3 || 'Field 3',
    },
    createdAt: q.createdAt,
  }));
  res.json(result);
};

// @desc    Bulk delete questions
// @route   POST /api/projects/:id/questions/bulk-delete
// @access  Private
const bulkDeleteQuestions = async (req, res) => {
  const projectId = Number(req.params.id);
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No question IDs provided' });
  }
  const numericIds = ids.map(Number).filter((n) => !isNaN(n));
  const result = await prisma.question.deleteMany({
    where: {
      projectId,
      id: { in: numericIds },
    },
  });
  res.json({ message: `Removed ${result.count} questions`, count: result.count });
};

// @desc    Seed curated sample questions for instant game testing
// @route   POST /api/projects/:id/questions/sample-seed
// @access  Private
const seedSampleQuestions = async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const isMcq = project.projectType === 'mcq';
  const nameLower = project.name.toLowerCase();

  let samples = [];
  if (isMcq) {
    if (nameLower.includes('cricket')) {
      samples = [
        {
          field1: 'How many players are on the field in a standard cricket team?',
          optionA: '9',
          optionB: '10',
          optionC: '11',
          optionD: '12',
          correctAnswer: 'C',
          hint: 'Same number as in association football (soccer).',
        },
        {
          field1: 'Which cricketer has scored 100 international centuries?',
          optionA: 'Virat Kohli',
          optionB: 'Sachin Tendulkar',
          optionC: 'Ricky Ponting',
          optionD: 'Brian Lara',
          correctAnswer: 'B',
          hint: 'Known as the "Master Blaster" from India.',
        },
        {
          field1: 'What is the maximum number of overs bowled per bowler in a T20 match?',
          optionA: '2',
          optionB: '4',
          optionC: '5',
          optionD: '10',
          correctAnswer: 'B',
          hint: 'One-fifth of the total 20 overs.',
        },
        {
          field1: 'What is it called when a bowler takes 3 wickets on 3 consecutive deliveries?',
          optionA: 'Maiden',
          optionB: 'Brace',
          optionC: 'Hat-trick',
          optionD: 'Five-for',
          correctAnswer: 'C',
          hint: 'A term borrowed from 19th century British custom of presenting a new hat.',
        },
        {
          field1: 'Which country won the inaugural ICC Men\'s T20 World Cup in 2007?',
          optionA: 'Pakistan',
          optionB: 'Australia',
          optionC: 'India',
          optionD: 'West Indies',
          correctAnswer: 'C',
          hint: 'Captained by MS Dhoni in South Africa.',
        },
      ];
    } else {
      samples = [
        {
          field1: 'Which planet is known as the Red Planet?',
          optionA: 'Venus',
          optionB: 'Mars',
          optionC: 'Jupiter',
          optionD: 'Saturn',
          correctAnswer: 'B',
          hint: 'Named after the Roman god of war.',
        },
        {
          field1: 'What is the capital city of France?',
          optionA: 'Berlin',
          optionB: 'Madrid',
          optionC: 'Rome',
          optionD: 'Paris',
          correctAnswer: 'D',
          hint: 'Home to the Eiffel Tower.',
        },
        {
          field1: 'What is the chemical symbol for Gold?',
          optionA: 'Ag',
          optionB: 'Fe',
          optionC: 'Au',
          optionD: 'Gd',
          correctAnswer: 'C',
          hint: 'From the Latin word Aurum.',
        },
        {
          field1: 'How many continents are there on Earth?',
          optionA: '5',
          optionB: '6',
          optionC: '7',
          optionD: '8',
          correctAnswer: 'C',
          hint: 'Asia, Africa, Americas, Europe, Antarctica, Australia.',
        },
        {
          field1: 'Who painted the Mona Lisa?',
          optionA: 'Vincent van Gogh',
          optionB: 'Pablo Picasso',
          optionC: 'Leonardo da Vinci',
          optionD: 'Claude Monet',
          correctAnswer: 'C',
          hint: 'Italian polymath of the Renaissance.',
        },
      ];
    }
  } else {
    samples = [
      {
        field1: 'Ephemeral',
        field2: 'Lasting for a very short time',
        field3: 'Think of transient beauty, like morning dew.',
      },
      {
        field1: 'Serendipity',
        field2: 'Finding valuable or agreeable things not sought for',
        field3: 'A happy, unexpected discovery.',
      },
      {
        field1: 'Resilient',
        field2: 'Able to withstand or recover quickly from difficult conditions',
        field3: 'Bouncing back after adversity.',
      },
      {
        field1: 'Eloquent',
        field2: 'Fluent or persuasive in speaking or writing',
        field3: 'Articulate and powerful communication.',
      },
      {
        field1: 'Pragmatic',
        field2: 'Dealing with things sensibly and realistically',
        field3: 'Focusing on practical results rather than theories.',
      },
    ];
  }

  const docs = samples.map((s) => ({
    projectId: project.id,
    field1: s.field1,
    field2: s.field2 || '',
    field3: s.field3 || '',
    optionA: s.optionA || '',
    optionB: s.optionB || '',
    optionC: s.optionC || '',
    optionD: s.optionD || '',
    correctAnswer: s.correctAnswer || '',
    hint: s.hint || s.field3 || '',
  }));

  const inserted = await prisma.question.createMany({ data: docs });
  res.status(201).json({ message: `Seeded ${inserted.count} sample questions`, count: inserted.count });
};

// @desc    Generate structured questions using AI (Gemini / AI model)
// @route   POST /api/projects/:id/questions/ai-generate
// @access  Private
const generateAIQuestions = async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const { prompt, count = 5, difficulty = 'medium', category = '', apiKey } = req.body;
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ message: 'Please provide a topic or prompt for AI generation' });
  }

  const isMcq = project.projectType === 'mcq';
  const numQuestions = Math.min(Math.max(1, Number(count) || 5), 20);
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(400).json({
      message: 'Gemini API Key is required. Please provide a key or add GEMINI_API_KEY to your .env file.',
    });
  }

  const systemInstruction = isMcq
    ? `You are an expert quizmaster and educational game designer. Generate exactly ${numQuestions} high-quality Multiple Choice Questions (MCQs) for the topic: "${prompt}".
Difficulty level: ${difficulty}.
Category/Tag: ${category || 'General'}.

You MUST return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "field1": "Question prompt here?",
    "optionA": "First option",
    "optionB": "Second option",
    "optionC": "Third option",
    "optionD": "Fourth option",
    "correctAnswer": "A", // Exactly one of: "A", "B", "C", "D"
    "hint": "Helpful educational clue for players",
    "difficulty": "${difficulty}",
    "category": "${category || 'General'}"
  }
]
Do not wrap in markdown or backticks. Return raw JSON array only.`
    : `You are an expert educational game designer. Generate exactly ${numQuestions} pairs of prompt and answers for the topic: "${prompt}".
Difficulty level: ${difficulty}.
Category/Tag: ${category || 'General'}.

Field labels:
Field 1: ${project.fieldLabelField1 || 'Prompt/Word'}
Field 2: ${project.fieldLabelField2 || 'Definition/Answer'}
Field 3: ${project.fieldLabelField3 || 'Hint/Clue'}

You MUST return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "field1": "Word or Prompt text",
    "field2": "Definition or Answer text",
    "field3": "Helpful educational clue or hint",
    "difficulty": "${difficulty}",
    "category": "${category || 'General'}"
  }
]
Do not wrap in markdown or backticks. Return raw JSON array only.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemInstruction }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      return res.status(geminiRes.status).json({
        message: `Gemini API returned error: ${errBody}`,
      });
    }

    const data = await geminiRes.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return res.status(500).json({ message: 'AI returned empty response' });
    }

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(candidateText);
    } catch {
      // In case wrapped in markdown
      const cleaned = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedQuestions = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(500).json({ message: 'Failed to parse AI generated questions as array' });
    }

    const docs = parsedQuestions.map((q) => ({
      projectId: project.id,
      field1: String(q.field1 || '').trim(),
      field2: String(q.field2 || '').trim(),
      field3: String(q.field3 || '').trim(),
      optionA: String(q.optionA || '').trim(),
      optionB: String(q.optionB || '').trim(),
      optionC: String(q.optionC || '').trim(),
      optionD: String(q.optionD || '').trim(),
      correctAnswer: String(q.correctAnswer || 'A').toUpperCase(),
      hint: String(q.hint || q.field3 || '').trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase())
        ? q.difficulty.toLowerCase()
        : difficulty,
      category: String(q.category || category || '').trim(),
    })).filter((q) => q.field1.length > 0);

    if (docs.length === 0) {
      return res.status(400).json({ message: 'No valid questions were generated' });
    }

    const inserted = await prisma.question.createMany({ data: docs });
    res.status(201).json({
      message: `AI generated and saved ${inserted.count} questions to MySQL`,
      count: inserted.count,
      questions: docs,
    });
  } catch (err) {
    res.status(500).json({ message: `AI generation failed: ${err.message}` });
  }
};

module.exports = wrapAll({
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestions,
  getRecentQuestions,
  bulkDeleteQuestions,
  seedSampleQuestions,
  generateAIQuestions,
});