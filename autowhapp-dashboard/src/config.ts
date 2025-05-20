const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`; 