// ─────────────────────────────────────────────────────────────────────────────
// API Service — all calls to the backend go through here.
//
// When your group member deploys the server, replace BASE_URL with the
// live URL he gives you, e.g. 'https://constitutai-backend.onrender.com'
// ─────────────────────────────────────────────────────────────────────────────
import { BASE_URL as APP_BASE_URL } from '../config/api';

export const BASE_URL = APP_BASE_URL;

// ── Generic request helper ────────────────────────────────────────────────────
async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the server's error message so callers can show it
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {{ token, refreshToken, user }}
 */
export const signup = (name, email, password) =>
  request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

/**
 * POST /api/auth/login
 * @param {string} email
 * @param {string} password
 * @returns {{ token, refreshToken, user }}
 */
export const login = (email, password) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

/**
 * POST /api/auth/logout
 */
export const logout = (token) =>
  request('/api/auth/logout', { method: 'POST' }, token);

/**
 * GET /api/auth/me — get the logged-in user's profile
 */
export const getMe = (token) =>
  request('/api/auth/me', { method: 'GET' }, token);

// ── Bookmarks ─────────────────────────────────────────────────────────────────

/**
 * GET /api/bookmarks — get all bookmarks for the logged-in user
 */
export const getBookmarks = (token) =>
  request('/api/bookmarks', { method: 'GET' }, token);

/**
 * POST /api/bookmarks/:articleId — add a bookmark
 */
export const addBookmark = (articleId, token) =>
  request(`/api/bookmarks/${articleId}`, { method: 'POST' }, token);

/**
 * DELETE /api/bookmarks/:articleId — remove a bookmark
 */
export const removeBookmark = (articleId, token) =>
  request(`/api/bookmarks/${articleId}`, { method: 'DELETE' }, token);

// ── History ─────────────────────────────────────────────────────────────────

/**
 * GET /api/history — get the current user's reading history
 */
export const getHistory = (token) =>
  request('/api/history', { method: 'GET' }, token);

/**
 * POST /api/history/:articleId — log that the user viewed an article
 */
export const logHistoryView = (articleId, token) =>
  request(`/api/history/${articleId}`, { method: 'POST' }, token);

// ── AI ────────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/ask or POST /api/ai/ask/:articleId
 * Sends the question and, when available, the article text from constitution.json
 * so the model can answer from that article without a Mongo lookup.
 */
export const askAI = ({ question, articleId, title, content }, token) => {
  const path = articleId
    ? `/api/ai/ask/${encodeURIComponent(articleId)}`
    : '/api/ai/ask';

  return request(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ question, title, content }),
    },
    token
  );
};

/**
 * POST /api/ai/ask/:articleId — ask a question about a specific article
 */
export const askAboutArticle = (articleId, question, token) =>
  askAI({ question, articleId }, token);

/**
 * POST /api/ai/summarize or POST /api/ai/summarize/:articleId
 * Sends article title/text from constitution.json so Mongo is not required.
 */
export const summarizeArticle = ({ articleId, title, content }, token) => {
  const path = articleId
    ? `/api/ai/summarize/${encodeURIComponent(articleId)}`
    : '/api/ai/summarize';

  return request(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    },
    token
  );
};

/**
 * POST /api/ai/auto-tag or POST /api/ai/auto-tag/:articleId
 * Sends article title/text from constitution.json so Mongo is not required.
 */
export const autoTagArticle = ({ articleId, title, content }, token) => {
  const path = articleId
    ? `/api/ai/auto-tag/${encodeURIComponent(articleId)}`
    : '/api/ai/auto-tag';

  return request(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    },
    token
  );
};
