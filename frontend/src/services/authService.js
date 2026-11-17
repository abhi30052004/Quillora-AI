/**
 * Quillora AI — Demo Authentication Service
 * 
 * Manages demo authentication sessions and mock user accounts via browser localStorage.
 * No backend database or external authentication provider is used.
 */

const AUTH_STORAGE_KEY = 'quillora_demo_auth';
const USERS_STORAGE_KEY = 'quillora_demo_users';

export const DEMO_CREDENTIALS = {
  username: 'user',
  password: '123',
  name: 'Demo Writer',
  email: 'user@quillora.ai',
};

export const authService = {
  getStoredSession() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getRegisteredUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  login(username, password) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Check default demo account
    if (cleanUser === DEMO_CREDENTIALS.username && cleanPass === DEMO_CREDENTIALS.password) {
      const session = {
        user: {
          username: DEMO_CREDENTIALS.username,
          name: DEMO_CREDENTIALS.name,
          email: DEMO_CREDENTIALS.email,
          role: 'Demo User',
        },
        token: 'demo-token-' + Date.now(),
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true, user: session.user };
    }

    // 2. Check registered accounts
    const users = this.getRegisteredUsers();
    const found = users.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (found) {
      const session = {
        user: {
          username: found.username,
          name: found.name || found.username,
          email: found.email || `${found.username}@quillora.ai`,
          role: 'Registered Demo User',
        },
        token: 'demo-token-' + Date.now(),
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true, user: session.user };
    }

    return {
      success: false,
      error: 'Invalid username or password. Please use demo credentials: user / 123',
    };
  },

  register(userData) {
    const { name, username, email, password } = userData;
    const cleanUser = username.trim().toLowerCase();

    if (!cleanUser || !password) {
      return { success: false, error: 'Username and password are required.' };
    }

    if (cleanUser === DEMO_CREDENTIALS.username) {
      return { success: false, error: 'Username already taken by the primary demo account.' };
    }

    const users = this.getRegisteredUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      return { success: false, error: 'Username already registered.' };
    }

    const newUser = {
      name: name.trim() || username,
      username: username.trim(),
      email: email.trim(),
      password: password,
      registeredAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Automatically log in after registration
    return this.login(newUser.username, newUser.password);
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
