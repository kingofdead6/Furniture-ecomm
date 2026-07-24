import axios from "axios";
import { API_BASE_URL } from "../../api";

// Central axios instance. Attaches the auth token (customer or admin) to every
// request so components never wire headers by hand.
export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise API errors to a readable message for toasts / error states.
export function apiError(err, fallback = "Something went wrong. Please try again.") {
  return err?.response?.data?.message || err?.message || fallback;
}

export { API_BASE_URL };
