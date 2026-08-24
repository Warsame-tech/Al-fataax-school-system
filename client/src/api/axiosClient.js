import axios from 'axios';

const baseConfig = {
  baseURL: '/api',
  withCredentials: true,
};

function normalizeError(error) {
  const payload = error.response?.data;
  const fieldErrors = payload?.errors;
  let message = payload?.message || error.message || 'Something went wrong';
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    message = fieldErrors.map((e) => e.message).filter(Boolean).join(' ') || message;
  }
  const normalized = new Error(message);
  normalized.status = error.response?.status;
  normalized.errors = fieldErrors;
  return Promise.reject(normalized);
}

const axiosClient = axios.create(baseConfig);

// Unwrap the `{ success, data }` envelope on success, and normalize errors
// into a single `.message` (plus `.errors` if the server sent field-level
// validation errors) so callers never have to poke at response.data shapes.
axiosClient.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
}, normalizeError);

// Same auth/baseURL setup, but returns the FULL response envelope
// (`{ success, data, ...extra }`) unwrapped one level less — used by
// endpoints that return extra top-level metadata alongside `data`
// (e.g. GET /results/by-class also returns `subjectColumns`).
export const axiosClientEnvelope = axios.create(baseConfig);
axiosClientEnvelope.interceptors.response.use((response) => response.data, normalizeError);

export default axiosClient;
