export interface ToastProps{ tone?: 'neutral'|'success'|'warning'|'danger'; title: string; description?: string; onDismiss?: () => void; }
