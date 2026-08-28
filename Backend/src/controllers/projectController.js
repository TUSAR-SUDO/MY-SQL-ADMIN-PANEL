const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Helper: convert a DB project row into the API response shape
// (reconstruct nested fieldLabels, map id → _id)
const projectToResponse = (p) => ({
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
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// @desc    List projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  const { search = '' } = req.query;
  // Clamp pagination so bad input can't request huge/negative pages.
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const where = search
    ? { name: { contains: search } }
    : {};

  const total = await prisma.project.count({ where });
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Attach question counts for dashboard stats
  const projectIds = projects.map((p) => p.id);
  const counts = await prisma.question.groupBy({
    by: ['projectId'],
    _count: { id: true },
    where: { projectId: { in: projectIds } },
  });
  const countMap = {};
  counts.forEach((c) => {
    countMap[c.projectId] = c._count.id;
  });

  const projectsWithCounts = projects.map((p) => ({
    ...projectToResponse(p),
    questionCount: countMap[p.id] || 0,
  }));

  res.json({ projects: projectsWithCounts, total, page, limit });
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  const { name, fieldLabels, mainQuestionField, questionsPerQuiz, projectType, allowedOrigins } = req.body;
  const slug = slugify(name);
  if (!slug) {
    return res.status(400).json({ message: 'Project name must produce a valid slug' });
  }
  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) {
    return res.status(400).json({ message: 'A project with this name already exists' });
  }
  const project = await prisma.project.create({
    data: {
      name,
      slug,
      projectType: projectType || 'classic',
      fieldLabelField1: fieldLabels?.field1 || 'Field 1',
      fieldLabelField2: fieldLabels?.field2 || 'Field 2',
      fieldLabelField3: fieldLabels?.field3 || 'Field 3',
      mainQuestionField: mainQuestionField || 'field2',
      questionsPerQuiz: questionsPerQuiz || 15,
      allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins : [],
    },
  });
  res.status(201).json(projectToResponse(project));
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(projectToResponse(project));
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const { name, fieldLabels, mainQuestionField, questionsPerQuiz, projectType, allowedOrigins } = req.body;
  const updateData = {};

  if (name !== undefined) {
    const newSlug = slugify(name);
    if (!newSlug) {
      return res.status(400).json({ message: 'Project name must produce a valid slug' });
    }
    const existing = await prisma.project.findFirst({
      where: { slug: newSlug, NOT: { id: project.id } },
    });
    if (existing) {
      return res.status(400).json({ message: 'A project with this name already exists' });
    }
    updateData.name = name;
    updateData.slug = newSlug;
  }
  if (fieldLabels) {
    updateData.fieldLabelField1 = fieldLabels.field1 || project.fieldLabelField1;
    updateData.fieldLabelField2 = fieldLabels.field2 || project.fieldLabelField2;
    updateData.fieldLabelField3 = fieldLabels.field3 || project.fieldLabelField3;
  }
  if (projectType !== undefined) updateData.projectType = projectType;
  if (mainQuestionField !== undefined) updateData.mainQuestionField = mainQuestionField;
  if (questionsPerQuiz !== undefined) updateData.questionsPerQuiz = questionsPerQuiz;
  if (allowedOrigins !== undefined) {
    updateData.allowedOrigins = Array.isArray(allowedOrigins)
      ? allowedOrigins.map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
      : [];
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: updateData,
  });
  res.json(projectToResponse(updated));
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  // Cascade delete is handled by the Prisma schema (onDelete: Cascade),
  // but we explicitly delete questions first for clarity and reliability
  await prisma.question.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  res.json({ message: 'Project and its questions removed' });
};

module.exports = wrapAll({ getProjects, createProject, getProject, updateProject, deleteProject });