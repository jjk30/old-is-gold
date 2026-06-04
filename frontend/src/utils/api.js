// Shared API client.
//
// - Reads the API base URL from VITE_API_URL (no more copy-pasted constants).
// - Attaches the caller's Firebase ID token as `Authorization: Bearer <token>`
//   on every request, so the backend can verify the caller server-side.

import { auth } from '../firebase'

const API_URL = import.meta.env.VITE_API_URL

async function authHeader() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}), ...(await authHeader()) }
  return fetch(`${API_URL}${path}`, { ...options, headers })
}

export function apiGet(path) {
  return apiFetch(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' })
}

export { API_URL }
