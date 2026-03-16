import axios from "axios";
const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  isRefreshing = false;
  failedQueue = [];
  window.location.href = "/login";
};

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;
    const code = err.response?.data?.code;

    // No response at all (network error) — just reject
    if (!err.response) {
      return Promise.reject(err);
    }

    // Token is straight up invalid or user not found — hard logout immediately
    if (status === 401 && code === "TOKEN_INVALID") {
      clearAuthAndRedirect();
      return Promise.reject(err);
    }

    // Access token expired — attempt silent refresh
    if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      // If refresh already in progress, queue this request
      // until the refresh resolves
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((e) => Promise.reject(e));
      }

      // Mark this request so it doesn't retry infinitely
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token cookie is sent automatically by browser
        await apiClient.post("/user/refresh-token");

        // Unblock all queued requests
        processQueue(null);

        // Retry the original request — new access cookie is now set
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token also expired or invalid — full logout
        processQueue(refreshError);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Any other non-401 error (400, 403, 500 etc.) — pass through to caller
    return Promise.reject(err);
  },
);

export default apiClient;
