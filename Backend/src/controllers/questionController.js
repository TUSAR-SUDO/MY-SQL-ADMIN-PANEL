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
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

// @desc    List questions for a project
// @route   GET /api/projects/:id/questions
// @access  Private
const getQuestions = async (req, res) => {
  const { search = '' } = req.query;
  // Clamp pagination so bad input can't request huge/negative pages.
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
  const { field1, field2, field3, optionA, optionB, optionC, optionD, correctAnswer, hint } = req.body;

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
  const { field1, field2, field3, optionA, optionB, optionC, optionD, correctAnswer, hint } = req.body;
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

module.exports = wrapAll({
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestions,
  getRecentQuestions,
});