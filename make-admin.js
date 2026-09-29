import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';

// Same DNS fix as server
const dnsServers = process.env.DNS_SERVERS;
if (dnsServers) {
  dns.setServers(String(dnsServers).split(',').map(s => s.trim()).filter(Boolean));
}
const dnsResultOrder = process.env.DNS_RESULT_ORDER;
if (dnsResultOrder) {
  dns.setDefaultResultOrder(String(dnsResultOrder).trim());
}

await mongoose.connect(process.env.MONGO_URI);
const result = await User.findOneAndUpdate(
  { email: 'admin@gamezone.com' },
  { role: 'admin' },
  { new: true }
);
console.log('✅ Role updated:', result.role, '| Email:', result.email, '| ID:', result._id);
await mongoose.disconnect();
