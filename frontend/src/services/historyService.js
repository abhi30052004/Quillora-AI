/**
 * Quillora AI — Writing History Service
 * 
 * Manages ChatGPT-style writing sessions stored in browser localStorage.
 */

const HISTORY_KEY = 'quillora_writing_history';

export const historyService = {
  getInitialDefaultSessions() {
    return [
      {
        id: 'session-demo-1',
        title: 'Morning Forest Hike Story',
        content: `The morning sun broke through the thick pines. He go along the mossy path admiring the birds. It had been years since he last visited the valley, and the silence was very nice.`,
        mode: 'checker',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        checkerIssues: [],
        enhancerSuggestions: [],
        selectedTone: 'creative',
        englishVariant: 'American',
      },
      {
        id: 'session-demo-2',
        title: 'Quarterly Executive Summary',
        content: `The marketing department did a good job during the second quarter. We got a lot of new clients and improved our customer satisfaction metrics.`,
        mode: 'enhancer',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        checkerIssues: [],
        enhancerSuggestions: [],
        selectedTone: 'formal',
        englishVariant: 'American',
      },
      {
        id: 'session-demo-3',
        title: 'Dialogue with the Detective',
        content: `"Hurry up," John whispered into the dark alleyway. "We got to leave before the patrol arrives." Mary felt very tired but kept running.`,
        mode: 'checker',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        checkerIssues: [],
        enhancerSuggestions: [],
        selectedTone: 'creative',
        englishVariant: 'American',
      },
    ];
  },

  getAllSessions() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (!data) {
        const defaults = this.getInitialDefaultSessions();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(defaults));
        return defaults;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.getInitialDefaultSessions();
    }
  },

  generateTitle(content, fallback = 'Untitled Document') {
    if (!content || !content.trim()) return fallback;
    const clean = content.trim().replace(/^["']/, '');
    const firstLine = clean.split('\n')[0].trim();
    const firstSentence = firstLine.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 3) {
      return firstSentence.length > 38 ? firstSentence.slice(0, 38) + '...' : firstSentence;
    }
    return fallback;
  },

  saveSession(sessionData) {
    const sessions = this.getAllSessions();
    const now = new Date().toISOString();

    const title = sessionData.title && sessionData.title !== 'Untitled Document'
      ? sessionData.title
      : this.generateTitle(sessionData.content, 'Untitled Document');

    const existingIndex = sessions.findIndex(s => s.id === sessionData.id);

    if (existingIndex !== -1) {
      sessions[existingIndex] = {
        ...sessions[existingIndex],
        ...sessionData,
        title,
        updatedAt: now,
      };
    } else {
      const newSession = {
        id: sessionData.id || `session-${Date.now()}`,
        title,
        content: sessionData.content || '',
        mode: sessionData.mode || 'checker',
        createdAt: sessionData.createdAt || now,
        updatedAt: now,
        checkerIssues: sessionData.checkerIssues || [],
        enhancerSuggestions: sessionData.enhancerSuggestions || [],
        selectedTone: sessionData.selectedTone || 'neutral',
        englishVariant: sessionData.englishVariant || 'American',
      };
      sessions.unshift(newSession);
    }

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
    return sessions;
  },

  deleteSession(id) {
    let sessions = this.getAllSessions();
    sessions = sessions.filter(s => s.id !== id);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to delete session from localStorage:', e);
    }
    return sessions;
  },

  renameSession(id, newTitle) {
    const sessions = this.getAllSessions();
    const target = sessions.find(s => s.id === id);
    if (target && newTitle.trim()) {
      target.title = newTitle.trim();
      target.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn('Failed to rename session in localStorage:', e);
      }
    }
    return sessions;
  },

  groupSessionsByDate(sessions) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 1000 * 60 * 60 * 24;
    const startOf7Days = startOfToday - 1000 * 60 * 60 * 24 * 7;

    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: [],
    };

    sessions.forEach(s => {
      const updatedTime = new Date(s.updatedAt || s.createdAt).getTime();
      if (updatedTime >= startOfToday) {
        groups.today.push(s);
      } else if (updatedTime >= startOfYesterday) {
        groups.yesterday.push(s);
      } else if (updatedTime >= startOf7Days) {
        groups.previous7Days.push(s);
      } else {
        groups.older.push(s);
      }
    });

    return groups;
  },
};
