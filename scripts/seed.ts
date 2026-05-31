import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || 'your_mongodb_uri_here';

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});

  const adminPassword = await bcrypt.hash('admin123', 12);
  const studentPassword = await bcrypt.hash('student123', 12);

  await User.create([
    { username: 'deepakdnayak', password: adminPassword, role: 'admin' },
    { username: 'shashankdnayak', password: studentPassword, role: 'student' },
  ]);

  console.log('✅ Users seeded:');
  console.log('   Admin    → username: deepakdnayak   | password: admin123');
  console.log('   Student  → username: shashankdnayak | password: student123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});