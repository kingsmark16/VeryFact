import axios, { AxiosError } from "axios";

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, detail: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
  headers: {
    Accept: "application/json",
  },
  timeout: 30_000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetail>) => {
    const status = error.response?.status ?? 500;
    const problem = error.response?.data;
    const detail = problem?.detail || error.message || "Unexpected error occurred";
    const title = problem?.title || "Request failed";
    const retryHeader = error.response?.headers?.["retry-after"];
    const retryAfterSeconds = retryHeader ? Number.parseInt(String(retryHeader), 10) : undefined;

    return Promise.reject(new ApiError(title, status, detail, retryAfterSeconds));
  },
);
