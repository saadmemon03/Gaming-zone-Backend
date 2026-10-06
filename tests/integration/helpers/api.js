export function getIntegrationConfig() {
  const { API_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } = process.env;
  const missing = [
    ["API_BASE_URL", API_BASE_URL],
    ["TEST_ADMIN_EMAIL", TEST_ADMIN_EMAIL],
    ["TEST_ADMIN_PASSWORD", TEST_ADMIN_PASSWORD],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Set the required integration-test environment variables: ${missing.join(", ")}`);
  }

  const apiUrl = new URL(API_BASE_URL);
  if (!["http:", "https:"].includes(apiUrl.protocol)) {
    throw new Error("API_BASE_URL must use HTTP or HTTPS.");
  }

  return {
    baseUrl: API_BASE_URL.replace(/\/+$/, ""),
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  };
}

export async function loginAsAdmin() {
  const config = getIntegrationConfig();
  const response = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });
  const data = await response.json();

  if (!response.ok || data.success !== true || !data.token || data.user?.role !== "admin") {
    throw new Error(
      `Admin login failed (HTTP ${response.status}): ${data.message ?? "Invalid response or account is not an admin"}`,
    );
  }

  return { ...config, token: data.token };
}
