import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import constitutionData from '../data/constitution';
import { addBookmark, getBookmarks, getHistory, logHistoryView, removeBookmark } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// ── Storage keys ─────────────────────────────────────────────
const KEYS = {
  DARK_MODE:       'app:darkMode',
  NOTIFICATIONS:   'app:notifications',
  SAVED_ARTICLES:  'app:savedArticles',
  SAVED_NOTES:     'app:savedNotes',
  HISTORY_ITEMS:   'app:historyItems',
  QUESTIONS_ASKED: 'app:questionsAsked',
  USER_NAME:       'app:userName',
  USER_EMAIL:      'app:userEmail',
  USER_PHONE:      'app:userPhone',
  ONBOARDING_DONE: 'app:onboardingDone',
  AUTH_TOKEN:      'app:authToken',
  REFRESH_TOKEN:   'app:refreshToken',
  USER_ID:         'app:userId',
};

// Helper: persist a value silently
const persist = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
};

// Helper: load a value with a fallback
const load = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
};

export function AppProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);

  const [darkMode,       setDarkModeState]       = useState(false);
  const [notifications,  setNotificationsState]  = useState(false);
  const [savedArticles,  setSavedArticles]        = useState([]);
  const [savedNotes,     setSavedNotes]           = useState([]);
  const [historyItems,   setHistoryItemsState]    = useState([]);
  const [questionsAsked, setQuestionsAsked]       = useState(0);
  const [userName,       setUserNameState]        = useState('');
  const [userEmail,      setUserEmailState]       = useState('');
  const [userPhone,      setUserPhoneState]       = useState('');
  const [onboardingDone, setOnboardingDoneState]  = useState(false);
  const [authToken,      setAuthTokenState]       = useState(null);
  const [refreshToken,   setRefreshTokenState]    = useState(null);
  const [userId,         setUserIdState]          = useState(null);

  const resolveArticleId = (article) => article?.id ?? article?.articleId ?? article?._id ?? null;

  const findArticleById = (articleId) => {
    for (const chapter of constitutionData.chapters || []) {
      const article = chapter.articles?.find((item) => item.id === articleId);
      if (article) {
        return {
          ...article,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        };
      }
    }
    return null;
  };

  const setHistoryItems = (value) => {
    setHistoryItemsState(value);
    persist(KEYS.HISTORY_ITEMS, value);
  };

  const syncBookmarksFromServer = async () => {
    if (!authToken) return;

    try {
      const data = await getBookmarks(authToken);
      const serverBookmarks = Array.isArray(data?.bookmarks) ? data.bookmarks : [];
      const mapped = serverBookmarks
        .map((bookmark) => {
          const articleId = bookmark?.articleId ?? bookmark?.id;
          if (!articleId) return null;
          return findArticleById(articleId) ?? { id: articleId };
        })
        .filter(Boolean);

      setSavedArticles(mapped);
      persist(KEYS.SAVED_ARTICLES, mapped);
    } catch (error) {
      console.warn('Failed to sync bookmarks from server', error);
    }
  };

  const syncHistoryFromServer = async () => {
    if (!authToken) return;

    try {
      const data = await getHistory(authToken);
      const serverHistory = Array.isArray(data?.history) ? data.history : [];
      const mapped = serverHistory
        .map((entry) => {
          const articleId = entry?.articleId ?? entry?.id;
          if (!articleId) return null;
          const article = findArticleById(articleId);
          return {
            ...(article ?? { id: articleId }),
            viewedAt: entry?.viewedAt ?? entry?.createdAt ?? new Date().toISOString(),
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

      setHistoryItems(mapped);
    } catch (error) {
      console.warn('Failed to sync history from server', error);
    }
  };

  // ── Load everything from storage on first mount ───────────
  useEffect(() => {
    (async () => {
      const [
        dm, notif, articles, notes, history, questions,
        name, email, phone, obDone,
        token, rToken, uid,
      ] = await Promise.all([
        load(KEYS.DARK_MODE,       false),
        load(KEYS.NOTIFICATIONS,   false),
        load(KEYS.SAVED_ARTICLES,  []),
        load(KEYS.SAVED_NOTES,     []),
        load(KEYS.HISTORY_ITEMS,   []),
        load(KEYS.QUESTIONS_ASKED, 0),
        load(KEYS.USER_NAME,       ''),
        load(KEYS.USER_EMAIL,      ''),
        load(KEYS.USER_PHONE,      ''),
        load(KEYS.ONBOARDING_DONE, false),
        load(KEYS.AUTH_TOKEN,      null),
        load(KEYS.REFRESH_TOKEN,   null),
        load(KEYS.USER_ID,         null),
      ]);

      setDarkModeState(dm);
      setNotificationsState(notif);
      setSavedArticles(articles);
      setSavedNotes(notes);
      setHistoryItems(history);
      setQuestionsAsked(questions);
      setUserNameState(name);
      setUserEmailState(email);
      setUserPhoneState(phone);
      setOnboardingDoneState(obDone);
      setAuthTokenState(token);
      setRefreshTokenState(rToken);
      setUserIdState(uid);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    (async () => {
      if (authToken) {
        await Promise.all([syncBookmarksFromServer(), syncHistoryFromServer()]);
      }
    })();
  }, [hydrated, authToken]);

  // ── Setters that also persist ─────────────────────────────
  const setDarkMode = (val) => {
    setDarkModeState(val);
    persist(KEYS.DARK_MODE, val);
  };

  const setNotifications = (val) => {
    setNotificationsState(val);
    persist(KEYS.NOTIFICATIONS, val);
  };

  const setUserName = (val) => {
    setUserNameState(val);
    persist(KEYS.USER_NAME, val);
  };

  const setUserEmail = (val) => {
    setUserEmailState(val);
    persist(KEYS.USER_EMAIL, val);
  };

  const setUserPhone = (val) => {
    setUserPhoneState(val);
    persist(KEYS.USER_PHONE, val);
  };

  const markOnboardingDone = () => {
    setOnboardingDoneState(true);
    persist(KEYS.ONBOARDING_DONE, true);
  };

  // ── Auth token management ─────────────────────────────────
  // Call this after a successful login or signup
  const signIn = ({ token, refreshToken: rToken, user }) => {
    setAuthTokenState(token);
    setRefreshTokenState(rToken);
    setUserIdState(user.id);
    setUserNameState(user.name);
    setUserEmailState(user.email);
    persist(KEYS.AUTH_TOKEN,    token);
    persist(KEYS.REFRESH_TOKEN, rToken);
    persist(KEYS.USER_ID,       user.id);
    persist(KEYS.USER_NAME,     user.name);
    persist(KEYS.USER_EMAIL,    user.email);
  };

  // Call this on logout
  const signOut = async () => {
    setAuthTokenState(null);
    setRefreshTokenState(null);
    setUserIdState(null);
    setUserNameState('');
    setUserEmailState('');
    setQuestionsAsked(0);
    await AsyncStorage.multiRemove([
      KEYS.AUTH_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER_ID,
      KEYS.USER_NAME, KEYS.USER_EMAIL,
      KEYS.QUESTIONS_ASKED,
    ]);
  };

  // ── Bookmarks ─────────────────────────────────────────────
  const toggleSavedArticle = async (article) => {
    const articleId = resolveArticleId(article);
    if (!articleId) return;

    const isCurrentlySaved = savedArticles.some((a) => resolveArticleId(a) === articleId);

    setSavedArticles((prev) => {
      const exists = prev.some((a) => resolveArticleId(a) === articleId);
      const next = exists
        ? prev.filter((a) => resolveArticleId(a) !== articleId)
        : [...prev, { ...article, id: articleId }];
      persist(KEYS.SAVED_ARTICLES, next);
      return next;
    });

    if (authToken) {
      try {
        if (isCurrentlySaved) {
          await removeBookmark(articleId, authToken);
        } else {
          await addBookmark(articleId, authToken);
        }
      } catch (error) {
        console.warn('Failed to sync bookmark with server', error);
      }
    }
  };

  // ── Notes ─────────────────────────────────────────────────
  const addNote = (note) => {
    setSavedNotes((prev) => {
      const next = [note, ...prev];
      persist(KEYS.SAVED_NOTES, next);
      return next;
    });
  };

  const deleteNote = (id) => {
    setSavedNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      persist(KEYS.SAVED_NOTES, next);
      return next;
    });
  };

  const logArticleView = async (article) => {
    const articleId = resolveArticleId(article);
    if (!articleId) return;

    const enrichedArticle = findArticleById(articleId) ?? { ...article, id: articleId };

    setHistoryItems((prev) => {
      const next = [
        {
          ...enrichedArticle,
          viewedAt: new Date().toISOString(),
        },
        ...prev.filter((item) => resolveArticleId(item) !== articleId),
      ].slice(0, 20);
      persist(KEYS.HISTORY_ITEMS, next);
      return next;
    });

    if (authToken) {
      try {
        await logHistoryView(articleId, authToken);
      } catch (error) {
        console.warn('Failed to sync history with server', error);
      }
    }
  };

  // ── Questions ─────────────────────────────────────────────
  const incrementQuestions = () => {
    setQuestionsAsked((prev) => {
      const next = prev + 1;
      persist(KEYS.QUESTIONS_ASKED, next);
      return next;
    });
  };

  const theme = darkMode ? DARK : LIGHT;

  // Don't render children until storage is loaded — prevents flash of default values
  if (!hydrated) return null;

  return (
    <AppContext.Provider
      value={{
        // theme
        darkMode,
        setDarkMode,
        theme,
        // notifications
        notifications,
        setNotifications,
        // user profile
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        userPhone,
        setUserPhone,
        // auth
        authToken,
        userId,
        signIn,
        signOut,
        // onboarding
        onboardingDone,
        markOnboardingDone,
        // bookmarks
        savedArticles,
        toggleSavedArticle,
        // history
        historyItems,
        logArticleView,
        // notes
        savedNotes,
        addNote,
        deleteNote,
        // questions
        questionsAsked,
        incrementQuestions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ── Light theme ──────────────────────────────────────────────
const LIGHT = {
  bg: '#e8eaed',
  card: '#ffffff',
  headerBg: '#0f1f3d',
  text: '#1a1a2e',
  subText: '#888888',
  inputBg: '#f5f5f5',
  inputText: '#333333',
  border: '#f0f0f0',
  tabBar: '#ffffff',
  tabBorder: '#e8e8e8',
  settingValue: '#aaaaaa',
  label: '#444444',
};

// ── Dark theme ───────────────────────────────────────────────
const DARK = {
  bg: '#0d0d0d',
  card: '#1e1e2e',
  headerBg: '#07111f',
  text: '#f0f0f0',
  subText: '#aaaaaa',
  inputBg: '#2a2a3a',
  inputText: '#f0f0f0',
  border: '#2e2e3e',
  tabBar: '#151525',
  tabBorder: '#2e2e3e',
  settingValue: '#666666',
  label: '#cccccc',
};
