import { createContext, useCallback, useContext, useState } from 'react'

const AppDialogContext = createContext(null)

export function AppDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const [inputValue, setInputValue] = useState('')

  const open = useCallback((type, message, options = {}) => new Promise(resolve => {
    setInputValue(options.defaultValue || '')
    setDialog({
      type,
      title: options.title || (type === 'confirm' ? 'Please confirm' : type === 'prompt' ? 'Enter details' : 'LearnAfrica'),
      message: String(message || ''),
      placeholder: options.placeholder || '',
      confirmLabel: options.confirmLabel || (type === 'confirm' ? 'Continue' : type === 'prompt' ? 'Save' : 'OK'),
      resolve,
    })
  }), [])

  const alert = useCallback((message, options) => open('alert', message, options), [open])
  const confirm = useCallback((message, options) => open('confirm', message, options), [open])
  const prompt = useCallback((message, defaultValue = '', options = {}) => open('prompt', message, { ...options, defaultValue }), [open])

  const finish = (result) => {
    if (!dialog) return
    dialog.resolve(result)
    setDialog(null)
  }

  return (
    <AppDialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) finish(dialog.type === 'confirm' ? false : null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="learn-africa-dialog-title" aria-describedby="learn-africa-dialog-message" className="w-full max-w-md rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">LA</span>
              <h2 id="learn-africa-dialog-title" className="text-base font-semibold">{dialog.title}</h2>
            </div>
            <p id="learn-africa-dialog-message" className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{dialog.message}</p>
            {dialog.type === 'prompt' && (
              <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={dialog.placeholder} className="mt-4 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onKeyDown={e => { if (e.key === 'Enter') finish(inputValue); if (e.key === 'Escape') finish(null) }} />
            )}
            <div className="mt-5 flex justify-end gap-2">
              {dialog.type !== 'alert' && <button type="button" onClick={() => finish(dialog.type === 'confirm' ? false : null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>}
              <button type="button" onClick={() => finish(dialog.type === 'confirm' ? true : dialog.type === 'prompt' ? inputValue : true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">{dialog.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  const value = useContext(AppDialogContext)
  if (!value) throw new Error('useAppDialog must be used within AppDialogProvider')
  return value
}
