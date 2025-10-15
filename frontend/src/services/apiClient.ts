import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});

export async function getHealth(): Promise<{ status: string }> {
  const res = await api.get("/health");
  return res.data;
}

export default api;
