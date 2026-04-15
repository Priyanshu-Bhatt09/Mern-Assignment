import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("Missing MONGO_URI in environment");
}

async function createAdmin() {
  await mongoose.connect(mongoUri as string);

  const email = "admin@eg.com";
  const username = "admin";
  const password = "admin123";
  const name = "Admin";

  let user = await User.findOne({ email });
  if (user) {
    if (user.role !== "Admin") {
      user.role = "Admin";
    }

    if (!user.username) {
      user.username = username;
    }

    if (user.status !== "Active") {
      user.status = "Active";
    }

    await user.save();
    console.log(`Admin user ensured: ${email} / ${password}`);
  } else {
    user = new User({ name, username, email, password, role: "Admin", status: "Active" });
    await user.save();
    console.log(`Admin user created: ${email} / ${password}`);
  }

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
