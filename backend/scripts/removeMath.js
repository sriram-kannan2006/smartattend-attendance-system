const mongoose = require('mongoose');
const config = require('../config');

require('../models/User');
require('../models/Teacher');
require('../models/Class');
require('../models/Subject');
require('../models/Timetable');
require('../models/AttendanceSession');

async function removeMath() {
  try {
    await mongoose.connect(config.databaseUrl || 'mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');

    const Subject = mongoose.model('Subject');
    const Timetable = mongoose.model('Timetable');
    const Teacher = mongoose.model('Teacher');
    const AttendanceSession = mongoose.model('AttendanceSession');

    // 1. Find all subjects with Math or MA201
    const mathSubjects = await Subject.find({
      $or: [
        { name: /Mathematics/i },
        { code: /^MA/i },
      ],
    });

    console.log(`Found ${mathSubjects.length} math subjects:`, mathSubjects.map(s => `${s.name} (${s.code}) [${s._id}]`));
    const mathSubjectIds = mathSubjects.map(s => s._id);

    // 2. Remove from Timetable
    const deletedTimetables = await Timetable.deleteMany({
      subjectId: { $in: mathSubjectIds },
    });
    console.log(`Deleted ${deletedTimetables.deletedCount} timetable entries for Math`);

    // 3. Also check if there are timetable entries for ECE II Year that are obsolete
    const Class = mongoose.model('Class');
    const ece2 = await Class.find({ name: /ECE.*II/i });
    if (ece2.length > 0) {
      const deletedEce2Timetable = await Timetable.deleteMany({
        classId: { $in: ece2.map(c => c._id) },
        subjectId: { $in: mathSubjectIds },
      });
      console.log(`Deleted ${deletedEce2Timetable.deletedCount} ECE II Year Math timetable entries`);
    }

    // 4. Remove from Teacher assigned subjects
    const teacherUpdate = await Teacher.updateMany(
      { subjects: { $in: mathSubjectIds } },
      { $pull: { subjects: { $in: mathSubjectIds } } }
    );
    console.log(`Updated ${teacherUpdate.modifiedCount} teachers by pulling Math subject`);

    // 5. Remove any mock sessions for Math
    const deletedSessions = await AttendanceSession.deleteMany({
      subjectId: { $in: mathSubjectIds },
    });
    console.log(`Deleted ${deletedSessions.deletedCount} AttendanceSessions for Math`);

    // 6. Delete the Math Subject records
    const deletedSubjects = await Subject.deleteMany({
      _id: { $in: mathSubjectIds },
    });
    console.log(`Deleted ${deletedSubjects.deletedCount} Math Subject records`);

    console.log('✅ Mathematics period and subjects successfully removed!');
    process.exit(0);
  } catch (err) {
    console.error('Error removing math:', err);
    process.exit(1);
  }
}

removeMath();
