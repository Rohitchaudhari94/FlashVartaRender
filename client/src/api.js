
const TOKEN_KEY = 'fv_token';
const API_BASE = 'https://flashvartarender-1.onrender.com/api';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage unavailable - session won't persist.
  }
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const endpoint = `${API_BASE}${normalizedPath}`;

  let res;

  try {
    res = await fetch(endpoint, {
      method,
      headers,
      body: body !== undefined
        ? JSON.stringify(body)
        : undefined,
    });
  } catch (error) {
    console.error('API connection error:', error);

    throw new Error(
      'Cannot reach the server. Please check your internet connection or try again later.'
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const isAuthForm =
      normalizedPath.startsWith('/auth/login') ||
      normalizedPath.startsWith('/auth/register');

    if (
      token &&
      !isAuthForm &&
      (
        res.status === 401 ||
        (
          res.status === 403 &&
          typeof data.message === 'string' &&
          data.message.toLowerCase().includes('deactivated')
        )
      )
    ) {
      window.dispatchEvent(new Event('fv:unauthorized'));
    }

    const error = new Error(
      data.message || `Request failed with status ${res.status}`
    );

    error.status = res.status;

    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      body,
    }),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body,
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body,
    }),

  del: (path) =>
    request(path, {
      method: 'DELETE',
    }),
};
