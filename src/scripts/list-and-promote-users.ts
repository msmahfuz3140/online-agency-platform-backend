import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agency-platform";
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb("agency-platform");

  // Update MD.MAHFUZUL HAQUE and any mahfuz user to superadmin
  const updateResult = await db.collection("user").updateMany(
    { email: { $regex: "mahfuz", $options: "i" } },
    { $set: { role: "superadmin" } }
  );
  console.log(`Updated ${updateResult.modifiedCount} user(s) to role: "superadmin"`);

  // Verify
  const user = await db.collection("user").findOne({ email: { $regex: "mahfuz", $options: "i" } });
  console.log("Verified user in DB:", { id: user?._id, name: user?.name, email: user?.email, role: user?.role });

  await mongoose.disconnect();
}

main().catch(console.error);
