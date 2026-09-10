import axiosClient from './axiosClient';

// Admin-only global Results Visibility switch — the single source of
// truth for whether any non-admin role can view results anywhere in the
// system. See server/src/utils/systemSettings.js.
const settingsApi = {
  getResultsVisibility: () => axiosClient.get('/settings/results-visibility'),
  updateResultsVisibility: (resultsVisible) => axiosClient.put('/settings/results-visibility', { resultsVisible }),
};

export default settingsApi;
