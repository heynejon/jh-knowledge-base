import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.origin.includes('localhost') ? 'http://localhost:8000' : window.location.origin);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Article {
  _id: string;
  title: string;
  publication_name: string;
  full_text: string;
  summary: string;
  url: string;
  date_added: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  summarization_prompt: string;
}

export const articleApi = {
  getAllArticles: async (search?: string): Promise<Article[]> => {
    const response = await api.get('/api/articles', {
      params: search ? { search } : {},
    });
    return response.data;
  },

  getArticle: async (id: string): Promise<Article> => {
    const response = await api.get(`/api/articles/${id}`);
    return response.data;
  },

  createArticle: async (url: string): Promise<Article> => {
    const response = await api.post('/api/articles', { url });
    return response.data;
  },

  updateArticle: async (id: string, data: Partial<Article>): Promise<void> => {
    await api.put(`/api/articles/${id}`, data);
  },

  deleteArticle: async (id: string): Promise<void> => {
    await api.delete(`/api/articles/${id}`);
  },

  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  updateSettings: async (settings: Settings): Promise<void> => {
    await api.put('/api/settings', settings);
  },

  exportArticles: async (): Promise<any> => {
    const response = await api.get('/api/export');
    return response.data;
  },
};

export default api;