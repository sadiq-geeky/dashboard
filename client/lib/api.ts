interface AuthenticatedUser {
  uuid: string;
  username: string;
  role: "admin" | "manager" | "user";
  branch_id: string | null;
  branch_city: string | null;
  emp_name: string | null;
}

/**
 * Get the current authenticated user from localStorage
 */
function getCurrentUser(): AuthenticatedUser | null {
  try {
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (error) {
    console.error("Error parsing saved user:", error);
    localStorage.removeItem("auth_user");
  }
  return null;
}

/**
 * Create headers with authentication for API requests
 */
function createAuthHeaders(
  additionalHeaders: Record<string, string> = {},
): HeadersInit {
  const user = getCurrentUser();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (user?.uuid) {
    headers["x-user-id"] = user.uuid;
  }

  return headers;
}

/**
 * Authenticated fetch wrapper that automatically includes user authentication headers
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const { headers, ...restInit } = init;

  const authHeaders = createAuthHeaders(
    headers
      ? typeof headers === "object"
        ? (headers as Record<string, string>)
        : {}
      : {},
  );

  // Debug logging for authentication
  const currentUser = getCurrentUser();
  console.log("🔐 Auth debug:", {
    url: input.toString(),
    hasUser: !!currentUser,
    userId: currentUser?.uuid,
    headers: authHeaders,
  });

  const response = await fetch(input, {
    ...restInit,
    headers: authHeaders,
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Clear invalid session and redirect to login
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  return response;
}

/**
 * Helper for GET requests with authentication
 */
export async function authGet(url: string): Promise<Response> {
  return authFetch(url, { method: "GET" });
}

/**
 * Helper for POST requests with authentication
 */
export async function authPost(url: string, data?: any): Promise<Response> {
  return authFetch(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for PUT requests with authentication
 */
export async function authPut(url: string, data?: any): Promise<Response> {
  return authFetch(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for DELETE requests with authentication
 */
export async function authDelete(url: string): Promise<Response> {
  return authFetch(url, { method: "DELETE" });
}
