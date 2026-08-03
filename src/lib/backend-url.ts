export function getBackendUrl(): string {
  return process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export function getApiBaseUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendUrl()}${normalizedPath}`;
}