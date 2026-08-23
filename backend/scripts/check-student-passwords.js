const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Student = require('../models/Student');

async function checkStudents() {
  const mongoUri = config.databaseUrl || 'mongodb://localhost:27017/attendance_system';
  await mongoose.connect(mongoUri);

  const students = await Student.find().populate('userId');
  console.log(`Total Student Records in DB: ${students.length}`);

  let matchCount = 0;
  for (const st of students) {
    if (!st.userId) {
      console.log(`❌ Student ${st.name} has no linked User document!`);
      continue;
    }
    const user = await User.findById(st.userId._id).select('+password');
    const isMatch = await user.matchPassword('12345678');
    if (isMatch) {
      matchCount++;
    } else {
      console.log(`⚠️ Password mismatch for ${user.email}`);
    }
  }

  console.log(`✅ ${matchCount} out of ${students.length} students have password matching '12345678'`);
  process.exit(0);
}

checkStudents().catch(console.error);
