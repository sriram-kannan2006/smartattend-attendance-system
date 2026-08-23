const mongoose = require('mongoose');
const config = require('../config');
require('../models/User');
require('../models/Teacher');
require('../models/Class');
require('../models/Subject');
require('../models/Timetable');

async function checkSlots() {
  await mongoose.connect(config.databaseUrl || 'mongodb://localhost:27017/attendance_system');
  const Timetable = mongoose.model('Timetable');

  const slots = await Timetable.find({})
    .populate('subjectId', 'name code')
    .populate('classId', 'name')
    .populate('teacherId', 'name')
    .sort({ dayOfWeek: 1, hour: 1 });

  console.log(`Total slots: ${slots.length}`);
  for (const s of slots) {
    console.log(`Day ${s.dayOfWeek} | Hour ${s.hour} | ${s.subjectId?.name} (${s.subjectId?.code}) | Class: ${s.classId?.name} | Teacher: ${s.teacherId?.name}`);
  }
  process.exit(0);
}

checkSlots();
