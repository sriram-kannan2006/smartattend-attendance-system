const mongoose = require('mongoose');
const config = require('../config');
require('../models/User');
require('../models/Teacher');
require('../models/Class');
require('../models/Subject');
require('../models/Timetable');

async function cleanOldClasses() {
  await mongoose.connect(config.databaseUrl || 'mongodb://localhost:27017/attendance_system');
  const Class = mongoose.model('Class');
  const Timetable = mongoose.model('Timetable');

  const oldClasses = await Class.find({ name: { $ne: 'ECE III Year - Section D' } });
  console.log('Old/Other Classes:', oldClasses.map(c => c.name));

  const deleted = await Timetable.deleteMany({
    classId: { $in: oldClasses.map(c => c._id) }
  });
  console.log(`Deleted ${deleted.deletedCount} old timetable entries not belonging to ECE III Year - Section D`);
  process.exit(0);
}

cleanOldClasses();
