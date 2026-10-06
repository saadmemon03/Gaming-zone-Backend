import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from '../../src/models/User.model.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run admin:promote -- <email>');
  process.exitCode = 1;
} else if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined. Add it to gaming-api/.env');
  process.exitCode = 1;
} else {
  try {
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
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'admin', isVerified: true } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error(`No user found with email: ${email}`);
    }

    console.log('Role updated:', user.role, '| Email:', user.email, '| ID:', user._id);
  } catch (error) {
    console.error('Admin promotion failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
