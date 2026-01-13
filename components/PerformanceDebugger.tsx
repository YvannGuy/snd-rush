'use client';

import { useEffect, useRef } from 'react';

// Guard global pour éviter les patches multiples
declare global {
  interface Window {
    __PERF_DEBUGGER_PATCHED__?: boolean;
    __PERF_REPORT?: () => void;
  }
}

export default function PerformanceDebugger() {
  const statsRef = useRef({
    intervals: new Map<number, { fn: string; stack: string }>(),
    timeouts: new Map<number, { fn: string; stack: string }>(),
    listeners: new Map<string, { type: string; count: number }>(),
  });
  
  const lastReportTimeRef = useRef(0);
  const idCounterRef = useRef(0);

  useEffect(() => {
    // Ne patcher qu'en DEV et une seule fois
    if (process.env.NODE_ENV !== 'development') return;
    if (window.__PERF_DEBUGGER_PATCHED__) return;
    
    window.__PERF_DEBUGGER_PATCHED__ = true;
    
    const stats = statsRef.current;
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;
    const originalSetTimeout = window.setTimeout;
    const originalClearTimeout = window.clearTimeout;
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    
    // Helper pour tronquer le stack
    const truncateStack = (stack: string, maxLength = 200): string => {
      if (!stack) return 'no stack';
      return stack.length > maxLength 
        ? stack.substring(0, maxLength) + '...' 
        : stack;
    };
    
    // Helper pour obtenir un identifiant stable (éviter toString() qui peut être huge)
    const getStableId = (fn: (...args: any[]) => any): string => {
      const id = idCounterRef.current++;
      return `fn_${id}`;
    };
    
    // Patch setInterval (utiliser any pour éviter les conflits de types Node.js vs Browser)
    (window as any).setInterval = function(handler: TimerHandler, delay?: number, ...args: any[]): any {
      const id = originalSetInterval(handler as any, delay, ...args);
      const stack = truncateStack(new Error().stack || '');
      const fnId = typeof handler === 'function' ? getStableId(handler as (...args: any[]) => any) : 'string_handler';
      stats.intervals.set(Number(id), { fn: fnId, stack });
      return id;
    };
    
    // Patch clearInterval
    (window as any).clearInterval = function(id?: any): void {
      if (id !== undefined) {
        stats.intervals.delete(Number(id));
      }
      return originalClearInterval(id);
    };
    
    // Patch setTimeout
    (window as any).setTimeout = function(handler: TimerHandler, delay?: number, ...args: any[]): any {
      const id = originalSetTimeout(handler as any, delay, ...args);
      const stack = truncateStack(new Error().stack || '');
      const fnId = typeof handler === 'function' ? getStableId(handler as (...args: any[]) => any) : 'string_handler';
      stats.timeouts.set(Number(id), { fn: fnId, stack });
      return id;
    };
    
    // Patch clearTimeout
    (window as any).clearTimeout = function(id?: any): void {
      if (id !== undefined) {
        stats.timeouts.delete(Number(id));
      }
      return originalClearTimeout(id);
    };
    
    // Helper pour obtenir un ID stable pour les listeners
    const getListenerId = (listener: EventListenerOrEventListenerObject | null): string => {
      if (typeof listener === 'function') {
        return getStableId(listener);
      }
      if (listener && typeof listener === 'object' && 'handleEvent' in listener) {
        return `object_${idCounterRef.current++}`;
      }
      return 'null_listener';
    };
    
    // Patch addEventListener (simplifié, sans toString)
    (window as any).addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ): void {
      if (listener) {
        const key = `${type}_${getListenerId(listener)}`;
        const current = stats.listeners.get(key) || { type, count: 0 };
        current.count++;
        stats.listeners.set(key, current);
      }
      return originalAddEventListener(type, listener as EventListenerOrEventListenerObject, options);
    };
    
    // Patch removeEventListener
    (window as any).removeEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ): void {
      if (listener) {
        const key = `${type}_${getListenerId(listener)}`;
        const current = stats.listeners.get(key);
        if (current) {
          current.count--;
          if (current.count <= 0) {
            stats.listeners.delete(key);
          } else {
            stats.listeners.set(key, current);
          }
        }
      }
      return originalRemoveEventListener(type, listener as EventListenerOrEventListenerObject, options);
    };
    
    // Fonction de rapport (throttlée)
    const generateReport = () => {
      const now = Date.now();
      // Throttle : max 1 rapport toutes les 5 secondes
      if (now - lastReportTimeRef.current < 5000) return;
      lastReportTimeRef.current = now;
      
      const report: any = {
        timestamp: new Date().toISOString(),
        intervals: {
          active: stats.intervals.size,
          details: Array.from(stats.intervals.entries()).map(([id, data]) => ({
            id,
            fn: data.fn,
            stack: data.stack,
          })),
        },
        timeouts: {
          active: stats.timeouts.size,
          details: Array.from(stats.timeouts.entries()).map(([id, data]) => ({
            id,
            fn: data.fn,
            stack: data.stack,
          })),
        },
        listeners: {
          total: Array.from(stats.listeners.values()).reduce((sum, l) => sum + l.count, 0),
          byType: Array.from(stats.listeners.entries()).map(([key, data]) => ({
            type: data.type,
            count: data.count,
          })),
        },
      };
      
      // Memory info (fallback safe pour Safari)
      const perfMemory = (performance as any).memory;
      if (perfMemory) {
        report.memory = {
          used: Math.round(perfMemory.usedJSHeapSize / 1048576),
          total: Math.round(perfMemory.totalJSHeapSize / 1048576),
          limit: Math.round(perfMemory.jsHeapSizeLimit / 1048576),
        };
      } else {
        report.memory = { note: 'Not available in Safari' };
      }
      
      console.group('🔍 Performance Debugger Report');
      console.table(report.intervals.details);
      console.table(report.timeouts.details);
      console.table(report.listeners.byType);
      console.log('Memory:', report.memory);
      console.groupEnd();
      
      return report;
    };
    
    // Exposer la fonction de rapport
    window.__PERF_REPORT = generateReport;
    
    // Cleanup : restaurer les originaux
    return () => {
      window.setInterval = originalSetInterval;
      window.clearInterval = originalClearInterval;
      window.setTimeout = originalSetTimeout;
      window.clearTimeout = originalClearTimeout;
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
      window.__PERF_DEBUGGER_PATCHED__ = false;
      delete window.__PERF_REPORT;
    };
  }, []);
  
  // Ne rien rendre (composant invisible)
  return null;
}

