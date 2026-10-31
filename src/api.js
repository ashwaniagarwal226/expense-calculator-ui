import axios from "axios";

// Same host the UI is served from, so it also works from a phone on the LAN (`vite --host`).
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8081/api/expense/v1`;

const http = axios.create({ baseURL: BASE });

export const errorMessage = (e) =>
  e?.response?.data?.error || e?.message || "Something went wrong";

export const api = {
  banks: () => http.get("/banks").then((r) => r.data),
  aiStatus: () => http.get("/ai/status").then((r) => r.data),
  profiles: () => http.get("/profiles").then((r) => r.data),
  createProfile: (p) => http.post("/profiles", p).then((r) => r.data),
  updateProfile: (id, p) => http.put(`/profiles/${id}`, p).then((r) => r.data),
  deleteProfile: (id) => http.delete(`/profiles/${id}`).then((r) => r.data),
  upload: (file, bank, profileId) => {
    const form = new FormData();
    form.append("file", file);
    form.append("bank", bank || "AUTO");
    if (profileId) form.append("profileId", profileId);
    return http.post("/statements/upload", form).then((r) => r.data);
  },
  // profileId: a profile's id, or undefined for everyone
  insights: (profileId, bank) =>
    http.get("/insights", { params: { profileId, bank: bank || undefined } }).then((r) => r.data),
  savings: (profileId, months, refresh) =>
    http.get("/insights/savings", { params: { profileId, months, refresh } }).then((r) => r.data),
  transactions: (params) => http.get("/transactions", { params }).then((r) => r.data),
  setCategory: (id, body) => http.patch(`/transactions/${id}/category`, body).then((r) => r.data),
  recategorize: (profileId, ai) =>
    http.post("/transactions/recategorize", null, { params: { profileId, ai } }).then((r) => r.data),
  categories: () => http.get("/categories").then((r) => r.data),
  saveCategory: (c) => http.post("/categories", c).then((r) => r.data),
  rules: (profileId) => http.get("/rules", { params: { profileId } }).then((r) => r.data),
  addRule: (rule) => http.post("/rules", rule).then((r) => r.data),
  deleteRule: (id) => http.delete(`/rules/${id}`),
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const money = (v) => inr.format(Number(v || 0));
export const compact = (v) => {
  const n = Number(v || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(0)}k`;
  return `₹${n.toFixed(0)}`;
};
export const pct = (v, digits = 0) => (v === null || v === undefined ? "–" : `${(v * 100).toFixed(digits)}%`);
