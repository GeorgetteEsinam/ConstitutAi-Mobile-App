// ── API Base URL ──────────────────────────────────────────────
// Expo Go on the iPhone reaches this laptop through the phone hotspot.
// Update this IP if Windows assigns a different hotspot address later.
const EXPO_GO_BASE_URL = 'http://172.20.10.2:3001';

export const BASE_URL = EXPO_GO_BASE_URL;

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
