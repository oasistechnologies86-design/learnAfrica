import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const DialogContext = createContext(null);
let dialogId = 0;

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const active = queue[0] || null;
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(active?.defaultValue || '');
  }, [active?.id]);

  const enqueue = useCallback((type, message, options = {}) => new Promise(resolve => {
    setQueue(current => [...current, {
      id: ++dialogId, type, message: String(message ?? ''),
      title: options.title || (type === 'confirm' ? 'Please confirm' : type === 'prompt' ? 'Enter a value' : 'LearnAfrica'),
      placeholder: options.placeholder || '',
      defaultValue: options.defaultValue || '',
      confirmLabel: options.confirmLabel || (type === 'alert' ? 'Okay' : 'Continue'),
      cancelLabel: options.cancelLabel || 'Cancel',
      resolve,
    }]);
  }), []);

  const showAlert = useCallback((message, options) => enqueue('alert', message, options), [enqueue]);
  const confirm = useCallback((message, options) => enqueue('confirm', message, options), [enqueue]);
  const prompt = useCallback((message, defaultValue = '', options = {}) =>
    enqueue('prompt', message, { ...options, defaultValue }), [enqueue]);

  useEffect(() => {
    window.LearnAfricaDialog = { alert: showAlert, confirm, prompt };
    return () => { delete window.LearnAfricaDialog; };
  }, [showAlert, confirm, prompt]);

  const finish = (value) => {
    if (!active) return;
    active.resolve(value);
    setQueue(current => current.slice(1));
  };

  return (
    <DialogContext.Provider value={{ showAlert, confirm, prompt }}>
      {children}
      {active && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onMouseDown={event => { if (event.target === event.currentTarget && active.type === 'alert') finish(undefined); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="la-dialog-title"
            aria-describedby="la-dialog-message"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {active.type === 'alert' ? <Info className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="la-dialog-title" className="text-base font-semibold text-foreground">{active.title}</h2>
                <p id="la-dialog-message" className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{active.message}</p>
              </div>
              <button type="button" onClick={() => finish(active.type === 'confirm' ? false : active.type === 'prompt' ? null : undefined)}
                aria-label="Close dialog" className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {active.type === 'prompt' && (
              <input autoFocus value={inputValue} onChange={event => setInputValue(event.target.value)}
                placeholder={active.placeholder} className="mb-4 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            )}
            <div className="mt-5 flex justify-end gap-2">
              {active.type !== 'alert' && (
                <button type="button" onClick={() => finish(active.type === 'confirm' ? false : null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">{active.cancelLabel}</button>
              )}
              <button type="button" onClick={() => finish(active.type === 'alert' ? undefined : active.type === 'confirm' ? true : inputValue)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">{active.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used inside DialogProvider');
  return context;
}
