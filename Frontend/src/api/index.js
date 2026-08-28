import api from './axios';

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const getSetupStatus = () => api.get('/auth/setup-status');
export const setupAdmin = (data) => api.post('/auth/setup', data);
export const updateMe = (data) => api.put('/auth/me', data);

// Admins
export const getAdmins = () => api.get('/admins');
export const createAdmin = (data) => api.post('/admins', data);
export const updateAdmin = (id, data) => api.put(`/admins/${id}`, data);
export const deleteAdmin = (id) => api.delete(`/admins/${id}`);

// Projects
export const getProjects = (params) => api.get('/projects', { params });
export const createProject = (data) => api.post('/projects', data);
export const getProject = (id) => api.get(`/projects/${id}`);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Questions
export const getQuestions = (projectId, params) =>
  api.get(`/projects/${projectId}/questions`, { params });
export const addQuestion = (projectId, data) =>
  api.post(`/projects/${projectId}/questions`, data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
export const uploadQuestions = (projectId, formData) =>
  api.post(`/projects/${projectId}/questions/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const bulkDeleteQuestions = (projectId, ids) =>
  api.post(`/projects/${projectId}/questions/bulk-delete`, { ids });
export const seedSampleQuestions = (projectId) =>
  api.post(`/projects/${projectId}/questions/sample-seed`);
export const getRecentQuestions = (params) => api.get('/questions/recent', { params });

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// Public settings (no auth required)
export const getPublicSettings = () => api.get('/public-settings');