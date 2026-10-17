let listeners = [];
let idCounter = 0;

function emit(toasts) {
  listeners.forEach((fn) => fn(toasts));
}

let toasts = [];

function push(type, message, duration = 4000) {
  const id = ++idCounter;
  toasts = [...toasts, { id, type, message }];
  emit(toasts);
  setTimeout(() => dismiss(id), duration);
  return id;
}

function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit(toasts);
}

export const toast = {
  success: (message) => push('success', message),
  error: (message) => push('error', message),
  info: (message) => push('info', message),
  dismiss,
};

export function subscribeToasts(fn) {
  listeners.push(fn);
  fn(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
