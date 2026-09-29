(async () => {
  try {
    const login = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saadblogger53@gmail.com", password: "admin123" })
    });
    const { token, user } = await login.json();
    
    if (!token) throw new Error("No token");

    // Fetch stations
    const sRes = await fetch("http://localhost:5000/api/stations", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const sData = await sRes.json();
    const stationId = sData.data[0]._id;

    // Fetch users
    const uRes = await fetch("http://localhost:5000/api/users", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const uData = await uRes.json();
    const userId = uData.data[0]._id;

    // Create Booking
    const payload = {
      user: userId,
      station: stationId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      amount: 500,
      status: "Pending"
    };

    console.log("Sending payload:", payload);

    const bRes = await fetch("http://localhost:5000/api/bookings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    const bData = await bRes.json();
    console.log("Create Booking Res:", bRes.status, bData);
  } catch (err) {
    console.error(err);
  }
})();
