// ── API Base URL ──────────────────────────────────────────────
// The backend is deployed on Render, so the app no longer depends on the laptop hotspot.
export const BASE_URL = 'https://constitutai-mobile-app.onrender.com';

export const API = {
  // Auth
  login:    `${BASE_URL}/api/auth/login`,
  signup:   `${BASE_URL}/api/auth/signup`,

  // Articles
  articles: `${BASE_URL}/api/articles`,

  // AI
  ask:      `${BASE_URL}/api/ai/ask`,

  // Search
  search:   `${BASE_URL}/api/search`,

  // Bookmarks
  bookmarks: `${BASE_URL}/api/bookmarks`,

  // History
  history:  `${BASE_URL}/api/history`,
};
