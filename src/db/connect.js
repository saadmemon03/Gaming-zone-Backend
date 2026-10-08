import dns from "dns"
import mongoose from "mongoose";

const dnsServers = process.env.DNS_SERVERS;
if (dnsServers && String(dnsServers).trim()) {
  dns.setServers(
    String(dnsServers)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

const dnsResultOrder = process.env.DNS_RESULT_ORDER;
if (dnsResultOrder && String(dnsResultOrder).trim()) {
  dns.setDefaultResultOrder(String(dnsResultOrder).trim());
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined. Add it to gaming-api/.env");
  }

  try {
    mongoose.set('strictPopulate', false);
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully');
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    throw error;
  }
};

export const isDbReady = () => mongoose.connection.readyState === 1;

export default connectDB;