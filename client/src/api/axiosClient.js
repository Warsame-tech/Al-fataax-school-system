import axios from 'axios';
import { emitDataChanged, resourceFromUrl, isMutatingMethod } from '../utils/dataSync';

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

// After any successful mutation, broadcast which resource changed so every
// currently-mounted component showing that resource can refetch itself —
// this is the single place that powers auto-refresh app-wide (see
// utils/dataSync.js and hooks/useDataSync.js), instead of every page having
// to remember to notify after its own create/update/delete calls.
function notifyOnMutationSuccess(response) {
  if (isMutatingMethod(response.config?.method)) {
    emitDataChanged(resourceFromUrl(response.config?.url));
  }
  return response;
}

const axiosClient = axios.create(baseConfig);

// Unwrap the `{ success, data }` envelope on success, and normalize errors
// into a single `.message` (plus `.errors` if the server sent field-level
// validation errors) so callers never have to poke at response.data shapes.
axiosClient.interceptors.response.use((response) => {
  notifyOnMutationSuccess(response);
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
axiosClientEnvelope.interceptors.response.use((response) => {
  notifyOnMutationSuccess(response);
  return response.data;
}, normalizeError);

export default axiosClient;
