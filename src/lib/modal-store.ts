let _isOpen = false;
const listeners = new Set<() => void>();

export function getIsModalOpen() {
  return _isOpen;
}

export function setIsModalOpen(v: boolean) {
  _isOpen = v;
  listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
