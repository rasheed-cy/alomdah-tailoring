/**
 * Hook لإدارة الجلسة — يفحص، يجدّد، ويُنذر
 */
import { useEffect, useState, useCallback } from 'react';
import {
  getSession,
  isSessionValid,
  getRemainingSeconds,
  extendSession,
  clearSession,
} from '../utils/session.js';

// عتبات التحذير (بالثواني)
const WARNING_THRESHOLD = 120;  // قبل دقيقتين
const EXPIRING_THRESHOLD = 30;  // قبل 30 ثانية

export default function useSession(onExpire) {
  const [remaining, setRemaining] = useState(getRemainingSeconds());
  const [status, setStatus] = useState(
    isSessionValid() ? 'active' : 'expired'
  );

  // تسجيل النشاط
  const touch = useCallback(() => {
    if (isSessionValid()) {
      extendSession();
      setRemaining(getRemainingSeconds());
      setStatus('active');
    }
  }, []);

  // فحص دوري كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        setStatus('expired');
        if (onExpire) onExpire('expired');
        clearInterval(interval);
        return;
      }

      const r = getRemainingSeconds();
      setRemaining(r);

      if (r <= EXPIRING_THRESHOLD) {
        setStatus('expiring');
      } else if (r <= WARNING_THRESHOLD) {
        setStatus('warning');
      } else {
        setStatus('active');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  // مستمعو النشاط
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => touch(), 500);  // throttle
    };

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, [touch]);

  return {
    remaining,
    status,         // 'active' | 'warning' | 'expiring' | 'expired'
    minutes: Math.floor(remaining / 60),
    seconds: remaining % 60,
    touch,
  };
}