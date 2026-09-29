(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saadblogger53@gmail.com", password: "admin123" })
    });
    const data = await res.json();
    console.log("HTTP Status:", res.status);
    console.log("Response Data:", data);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
})();
