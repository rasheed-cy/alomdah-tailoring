/**
 * إدارة الجلسة — حفظ محلي + تمديد تلقائي
 * الجلسة صالحة 20 دقيقة (تُمدَّد عند النشاط)
 */

const SESSION_KEY = 'alomdah_session';
const USER_KEY = 'alomdah_user';
const SESSION_MINUTES = 20;
const SESSION_DURATION_MS = SESSION_MINUTES * 60 * 1000;

/**
 * يحفظ الجلسة بعد تسجيل الدخول
 */
export function saveSession(user, token) {
  const now = Date.now();
  const session = {
    user,
    token: token || '',
    startedAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('[Session] Saved:', {
      expiresAt: session.expiresAt,
      expiresAtDate: new Date(session.expiresAt).toISOString(),
      validFor: SESSION_MINUTES + ' minutes',
    });
    return session;
  } catch (e) {
    console.error('[Session] Save error:', e);
    return null;
  }
}

/**
 * يقرأ الجلسة الحالية
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // تحقق من الحقول المطلوبة
    if (!parsed.expiresAt) {
      console.warn('[Session] Missing expiresAt — session invalid');
      return null;
    }

    return parsed;
  } catch (e) {
    console.error('[Session] Parse error:', e);
    return null;
  }
}

/**
 * هل الجلسة صالحة الآن؟
 */
export function isSessionValid() {
  const session = getSession();
  if (!session) return false;
  const valid = Date.now() < session.expiresAt;

  if (!valid) {
    console.warn('[Session] Expired:', {
      now: Date.now(),
      expiresAt: session.expiresAt,
      diff: session.expiresAt - Date.now(),
    });
  }

  return valid;
}

/**
 * الوقت المتبقي بالثواني
 */
export function getRemainingSeconds() {
  const session = getSession();
  if (!session) return 0;
  const remaining = Math.floor((session.expiresAt - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * يُمدّد الجلسة (يُستدعى عند النشاط)
 */
export function extendSession() {
  const session = getSession();
  if (!session) return null;

  const now = Date.now();
  session.lastActivity = now;
  session.expiresAt = now + SESSION_DURATION_MS;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (e) {
    console.error('[Session] Extend error:', e);
    return null;
  }
}

/**
 * يُحدّث الـ token من الـ Backend
 */
export function updateSessionToken(token) {
  const session = getSession();
  if (!session) return null;
  session.token = token;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {}
  return session;
}

/**
 * المستخدم الحالي
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * هل المستخدم مدير؟
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'ADMIN';
}

/**
 * حذف الجلسة (تسجيل خروج)
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export { SESSION_DURATION_MS, SESSION_MINUTES };