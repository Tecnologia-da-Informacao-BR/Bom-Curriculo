import axios from "axios";
import { APICONNECTBACKEND } from "@/helpers/api-connect";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const httpClient = axios.create({
  baseURL: APICONNECTBACKEND,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete?.("Content-Type");
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      removeToken();
      if (window.location.pathname !== "/entrar") {
        window.location.href = "/entrar";
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Extracts the most useful error message from an API error response.
 * The backend error payload shape is `{ message, data: { errors | error | message | details } }`.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Algo deu errado. Tente novamente.",
): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          message?: string;
          data?: {
            errors?: unknown;
            error?: unknown;
            message?: unknown;
            details?: unknown;
          };
        }
      | undefined;

    const data = payload?.data;

    if (data) {
      if (typeof data.errors === "object" && data.errors !== null) {
        const firstValue = Object.values(data.errors)[0];
        if (Array.isArray(firstValue) && firstValue.length > 0) {
          return String(firstValue[0]);
        }
        if (typeof firstValue === "string") {
          return firstValue;
        }
      }

      const dataMessage = data.error ?? data.message ?? data.details;
      if (typeof dataMessage === "string" && dataMessage.length > 0) {
        return dataMessage;
      }
    }

    if (typeof payload?.message === "string" && payload.message.length > 0) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}