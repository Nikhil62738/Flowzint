import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const email = process.env.ADMIN_EMAIL || "admin@example.com";
const password = process.env.ADMIN_PASSWORD || "password123";

await connectDatabase();

const existing = await User.findOne({ email });
if (existing) {
  existing.role = "admin";
  await existing.save();
  console.log(`Admin role ensured for ${email}`);
} else {
  await User.create({
    name: "Demo Admin",
    email,
    password,
    role: "admin"
  });
  console.log(`Admin created: ${email} / ${password}`);
}

process.exit(0);
