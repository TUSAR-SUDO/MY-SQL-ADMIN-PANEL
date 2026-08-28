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
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const count = await prisma.question.count({ where: { projectId: project.id } });
  const limit = Math.min(project.questionsPerQuiz || 15, count);

  const isMcq = project.projectType === 'mcq';

  // MySQL random sampling: ORDER BY RAND() LIMIT ?
  // Using raw query for random selection (equivalent to MongoDB $sample)
  let questions;
  if (limit > 0) {
    if (isMcq) {
      questions = await prisma.$queryRaw`
        SELECT field1, optionA, optionB, optionC, optionD, correctAnswer, hint
        FROM Question
        WHERE projectId = ${project.id}
        ORDER BY RAND()
        LIMIT ${limit}
      `;
    } else {
      questions = await prisma.$queryRaw`
        SELECT field1, field2, field3
        FROM Question
        WHERE projectId = ${project.id}
        ORDER BY RAND()
        LIMIT ${limit}
      `;
    }
  } else {
    questions = [];
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
    questions,
  });
};

module.exports = wrapAll({ listProjects, getSession });