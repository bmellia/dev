import { apiBaseUrl } from "../config";


type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

type ErrorPayload = {
  detail?: string;
};


export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const unauthorizedEventName = "auth:unauthorized";


export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(unauthorizedEventName));
    }

    let message = `API request failed: ${response.status}`;

    try {
      const payload = (await response.json()) as ErrorPayload;
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // Keep the fallback message when the response body is empty or non-JSON.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
