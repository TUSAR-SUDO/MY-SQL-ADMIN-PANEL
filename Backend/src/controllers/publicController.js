const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

// @desc    List all available projects (for games to auto-detect)
// @route   GET /api/public/projects
// @access  Public
const listProjects = async (req, res) => {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      projectType: true,
      fieldLabelField1: true,
      fieldLabelField2: true,
      fieldLabelField3: true,
      mainQuestionField: true,
      questionsPerQuiz: true,
      allowedOrigins: true,
    },
  });
  const results = await Promise.all(
    projects.map(async (p) => {
      const count = await prisma.question.count({ where: { projectId: p.id } });
      return {
        _id: p.id,
        name: p.name,
        slug: p.slug,
        projectType: p.projectType,
        fieldLabels: {
          field1: p.fieldLabelField1,
          field2: p.fieldLabelField2,
          field3: p.fieldLabelField3,
        },
        mainQuestionField: p.mainQuestionField,
        questionsPerQuiz: p.questionsPerQuiz,
        allowedOrigins: typeof p.allowedOrigins === 'string' ? JSON.parse(p.allowedOrigins) : (p.allowedOrigins || []),
        questionCount: count,
      };
    })
  );
  res.json({ projects: results });
};

// @desc    Get a quiz session for a game
// @route   GET /api/public/projects/:slug/session
// @access  Public
const getSession = async (req, res) => {
  const { slug } = req.params;
  const { difficulty, category } = req.query;

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const requestedLimit = Number(req.query.limit) || project.questionsPerQuiz || 15;
  const limit = Math.min(Math.max(1, requestedLimit), 100);

  const isMcq = project.projectType === 'mcq';

  // Build filters for count check
  const where = { projectId: project.id };
  if (difficulty && difficulty !== 'all') {
    where.difficulty = difficulty.toLowerCase();
  }
  if (category && category !== 'all') {
    where.category = category;
  }

  const count = await prisma.question.count({ where });
  const take = Math.min(limit, count);

  let questions = [];
  if (take > 0) {
    if (isMcq) {
      if (difficulty && category) {
        questions = await prisma.$queryRaw`
          SELECT field1, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND difficulty = ${difficulty.toLowerCase()} AND category = ${category}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else if (difficulty) {
        questions = await prisma.$queryRaw`
          SELECT field1, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND difficulty = ${difficulty.toLowerCase()}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else if (category) {
        questions = await prisma.$queryRaw`
          SELECT field1, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND category = ${category}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else {
        questions = await prisma.$queryRaw`
          SELECT field1, optionA, optionB, optionC, optionD, correctAnswer, hint, difficulty, category
          FROM Question
          WHERE projectId = ${project.id}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      }
    } else {
      if (difficulty && category) {
        questions = await prisma.$queryRaw`
          SELECT field1, field2, field3, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND difficulty = ${difficulty.toLowerCase()} AND category = ${category}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else if (difficulty) {
        questions = await prisma.$queryRaw`
          SELECT field1, field2, field3, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND difficulty = ${difficulty.toLowerCase()}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else if (category) {
        questions = await prisma.$queryRaw`
          SELECT field1, field2, field3, difficulty, category
          FROM Question
          WHERE projectId = ${project.id} AND category = ${category}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      } else {
        questions = await prisma.$queryRaw`
          SELECT field1, field2, field3, difficulty, category
          FROM Question
          WHERE projectId = ${project.id}
          ORDER BY RAND()
          LIMIT ${take}
        `;
      }
    }
  }

  res.json({
    project: {
      name: project.name,
      slug: project.slug,
    },
    projectType: project.projectType || 'classic',
    fieldLabels: {
      field1: project.fieldLabelField1,
      field2: project.fieldLabelField2,
      field3: project.fieldLabelField3,
    },
    mainQuestionField: project.mainQuestionField,
    totalAvailable: count,
    questions,
  });
};

module.exports = wrapAll({ listProjects, getSession });