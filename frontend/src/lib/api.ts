import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

// Response error interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error?.response?.data?.detail ?? error.message;
    return Promise.reject(new Error(detail));
  }
);

// ---- Channels ----
export const channelApi = {
  list: (ownOnly = false) => api.get("/channels/", { params: { own_only: ownOnly } }),
  get: (id: number) => api.get(`/channels/${id}`),
  create: (data: object) => api.post("/channels/", data),
  update: (id: number, data: object) => api.patch(`/channels/${id}`, data),
  delete: (id: number) => api.delete(`/channels/${id}`),
  sync: (id: number) => api.post(`/channels/${id}/sync`),
  syncVideos: (id: number, maxResults = 50) =>
    api.post(`/channels/${id}/sync-videos`, null, { params: { max_results: maxResults } }),
  videos: (id: number, limit = 20, offset = 0) =>
    api.get(`/channels/${id}/videos`, { params: { limit, offset } }),
};

// ---- Trends ----
export const trendApi = {
  list: (source?: string, region = "US") =>
    api.get("/trends/", { params: { source, region } }),
  refresh: (region = "US") => api.post("/trends/refresh", null, { params: { region } }),
  youtubeTrending: (region = "US", maxResults = 25) =>
    api.get("/trends/youtube-trending", { params: { region, max_results: maxResults } }),
  google: (keywords: string, region = "US") =>
    api.get("/trends/google", { params: { keywords, region } }),
  reddit: (subreddits?: string, limit = 25) =>
    api.get("/trends/reddit", { params: { subreddits, limit } }),
  summary: () => api.get("/trends/summary"),
};

// ---- Content ----
export const contentApi = {
  generateTitles: (topic: string, channelStyle = "", count = 5) =>
    api.post("/content/generate/titles", { topic, channel_style: channelStyle, count }),
  generateTags: (title: string, description = "") =>
    api.post("/content/generate/tags", { title, description }),
  generateDescription: (title: string, outline = "") =>
    api.post("/content/generate/description", { title, outline }),
  generateOutline: (topic: string, durationMinutes = 10) =>
    api.post("/content/generate/outline", { topic, duration_minutes: durationMinutes }),
  generateScript: (topic: string, outline: string, durationMinutes = 10) =>
    api.post("/content/generate/script", { topic, outline, duration_minutes: durationMinutes }),
  generateTrendIdeas: (channelId: number, region = "US") =>
    api.post("/content/generate/trend-ideas", { channel_id: channelId, region }),

  listIdeas: (params?: {
    channel_id?: number;
    status?: string;
    starred?: boolean;
    limit?: number;
    offset?: number;
  }) => api.get("/content/ideas", { params }),
  createIdea: (data: object) => api.post("/content/ideas", data),
  getIdea: (id: number) => api.get(`/content/ideas/${id}`),
  updateIdea: (id: number, data: object) => api.patch(`/content/ideas/${id}`, data),
  deleteIdea: (id: number) => api.delete(`/content/ideas/${id}`),
};

// ---- Analytics ----
export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
  channelPerformance: (channelId: number, days = 30) =>
    api.get(`/analytics/channels/${channelId}/performance`, { params: { days } }),
  channelStrategy: (channelId: number) =>
    api.get(`/analytics/channels/${channelId}/ai-strategy`),
  tokens: (days = 30) => api.get("/analytics/tokens", { params: { days } }),
  tokenBreakdown: (days = 7) => api.get("/analytics/tokens/breakdown", { params: { days } }),
};

// ---- Settings ----
export const settingsApi = {
  status: () => api.get("/settings/status"),
  validateYoutube: () => api.post("/settings/validate/youtube"),
  validateOpenAI: () => api.post("/settings/validate/openai"),
};
