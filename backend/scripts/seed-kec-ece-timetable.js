const mongoose = require('mongoose');
const config = require('../config');

// Models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const PERIOD_TIMES = {
  1: { startTime: '08:45 AM', endTime: '09:35 AM' },
  2: { startTime: '09:35 AM', endTime: '10:25 AM' },
  3: { startTime: '10:45 AM', endTime: '11:35 AM' },
  4: { startTime: '11:35 AM', endTime: '12:25 PM' },
  5: { startTime: '01:25 PM', endTime: '02:15 PM' },
  6: { startTime: '02:15 PM', endTime: '03:05 PM' },
  7: { startTime: '03:25 PM', endTime: '04:15 PM' },
};

const SUBJECT_DEFS = [
  { code: '24ECT51', name: 'Digital Signal Processing', shortName: 'DSP', type: 'THEORY', facultyEmail: 'indhumathi.ece@kongu.ac.in', facultyName: 'Ms. N. Indhumathi', phone: '9789223405', room: 'ECE 004 / ECE102' },
  { code: '24ECT52', name: 'Analog and Digital Communication', shortName: 'ADC', type: 'THEORY', facultyEmail: 'ponkarthika.ece@kongu.ac.in', facultyName: 'Ms. M. Ponkarthika', phone: '7904923293', room: 'ECE 004 / ECE102' },
  { code: '24ECT53', name: 'Control Engineering', shortName: 'CE', type: 'THEORY', facultyEmail: 'ppavithara.ece@kongu.ac.in', facultyName: 'Ms. P. Pavithara', phone: '7502114449', room: 'ECE 004 / ECE124' },
  { code: '24ECT54', name: 'Computer Organization and Architecture', shortName: 'COA', type: 'THEORY', facultyEmail: 'mmaheswaran_eie@kongu.ac.in', facultyName: 'Dr. S. Maheswaran', phone: '9842811344', room: 'ECE 004 / ECE116' },
  { code: '24ECH01', name: 'High Level Verification Using System Verilog', shortName: 'HD I', type: 'ELECTIVE', facultyEmail: 'kavinkumar.ece@kongu.edu', facultyName: 'Dr. K. Kavin Kumar', phone: '8760080999', room: 'ECE211' },
  { code: '24ECJ01', name: 'VLSI Design Flow: Front end', shortName: 'HD II', type: 'ELECTIVE', facultyEmail: 'sasikalas@kongu.ac.in', facultyName: 'Dr. S. Sasikala', phone: '9952514913', room: 'ECE220' },
  { code: '24MTO03', name: 'Open Elective - I (3D Printing and Design)', shortName: 'Open Elective - I', type: 'ELECTIVE', facultyEmail: 'graja@kongu.ac.in', facultyName: 'Mr. G. Raja', phone: '9842104444', room: 'MTB204' },
  { code: '24ECL51', name: 'Digital Signal Processing Laboratory', shortName: 'DSP Lab', type: 'LAB', facultyEmail: 'indhumathi.ece@kongu.ac.in', facultyName: 'Ms. N. Indhumathi', phone: '9789223405', room: 'ECE DSP LAB' },
  { code: '24ECL52', name: 'Analog and Digital Communication Laboratory', shortName: 'ADC Lab', type: 'LAB', facultyEmail: 'ponkarthika.ece@kongu.ac.in', facultyName: 'Ms. M. Ponkarthika', phone: '7904923293', room: 'ECE COMM LAB' },
  { code: '24EGL31', name: 'Communication Skills Development Laboratory', shortName: 'CSDL Lab', type: 'LAB', facultyEmail: 'rajlakshmi@kongu.ac.in', facultyName: 'Dr. P.V. Rajlakshmi', phone: '9042451731', room: 'CSDL LAB' },
  { code: '22GCL51', name: 'Professional Skills Training II', shortName: 'PST - II', type: 'LAB', facultyEmail: 'mekalav@kongu.ac.in', facultyName: 'Ms. V. Mekala', phone: '8220338821', room: 'ECE 004 / ECE116' },
  { code: '24PT51', name: 'Placement Training', shortName: 'PT', type: 'THEORY', facultyEmail: 'preethi.s@kongu.ac.in', facultyName: 'Ms. S. Preethi', phone: '9715206006', room: 'ECE 004' },
  { code: '24GEP51', name: 'Multi Disciplinary Mini Project / Cells & Clubs', shortName: 'Others', type: 'LAB', facultyEmail: 'mpavithra.ece@kongu.ac.in', facultyName: 'Dr. M. Pavithra', phone: '9698607418', room: 'ECE 004' },
];

// Weekly Timetable mapping from image:
// 1 = MON, 2 = TUE, 3 = WED, 4 = THU, 5 = FRI, 6 = SAT
const TIMETABLE_GRID = [
  // Monday (1)
  { day: 1, hour: 1, code: '24ECT51' }, // DSP
  { day: 1, hour: 2, code: '24ECT52' }, // ADC
  { day: 1, hour: 3, code: '24ECT53' }, // CE
  { day: 1, hour: 4, code: '24ECT54' }, // COA
  { day: 1, hour: 5, code: '24ECJ01' }, // HD II
  { day: 1, hour: 6, code: '24ECJ01' }, // HD II
  { day: 1, hour: 7, code: '24ECH01' }, // HD I

  // Tuesday (2)
  { day: 2, hour: 1, code: '24ECT54' }, // COA
  { day: 2, hour: 2, code: '24ECT51' }, // DSP
  { day: 2, hour: 3, code: '24MTO03' }, // Open Elective - I
  { day: 2, hour: 4, code: '24MTO03' }, // Open Elective - I
  { day: 2, hour: 5, code: '24ECT52' }, // ADC
  { day: 2, hour: 6, code: '24ECT53' }, // CE
  { day: 2, hour: 7, code: '24ECT51' }, // DSP

  // Wednesday (3)
  { day: 3, hour: 1, code: '24ECT53' }, // CE
  { day: 3, hour: 2, code: '24EGL31' }, // CSDL Lab
  { day: 3, hour: 3, code: '24EGL31' }, // CSDL Lab
  { day: 3, hour: 4, code: '24EGL31' }, // CSDL Lab
  { day: 3, hour: 5, code: '24ECT54' }, // COA
  { day: 3, hour: 6, code: '24PT51' },  // PT
  { day: 3, hour: 7, code: '24ECH01' }, // HD I

  // Thursday (4)
  { day: 4, hour: 1, code: '24ECL51' }, // DSP Lab / ADC Lab
  { day: 4, hour: 2, code: '24ECL51' }, // DSP Lab / ADC Lab
  { day: 4, hour: 3, code: '24MTO03' }, // Open Elective - I
  { day: 4, hour: 4, code: '24MTO03' }, // Open Elective - I
  { day: 4, hour: 5, code: '22GCL51' }, // PST - II
  { day: 4, hour: 6, code: '22GCL51' }, // PST - II
  { day: 4, hour: 7, code: '24ECT53' }, // CE

  // Friday (5)
  { day: 5, hour: 1, code: '24ECT52' }, // ADC
  { day: 5, hour: 2, code: '24ECT51' }, // DSP
  { day: 5, hour: 3, code: '22GCL51' }, // PST - II
  { day: 5, hour: 4, code: '22GCL51' }, // PST - II
  { day: 5, hour: 5, code: '24ECL52' }, // ADC Lab / DSP Lab
  { day: 5, hour: 6, code: '24ECL52' }, // ADC Lab / DSP Lab
  { day: 5, hour: 7, code: '24ECT52' }, // ADC

  // Saturday (6)
  { day: 6, hour: 1, code: '24ECH01' }, // HD I
  { day: 6, hour: 2, code: '24ECH01' }, // HD I
  { day: 6, hour: 3, code: '24ECJ01' }, // HD II
  { day: 6, hour: 4, code: '24ECJ01' }, // HD II
  { day: 6, hour: 5, code: '24GEP51' }, // Others
  { day: 6, hour: 6, code: '24GEP51' }, // Others
  { day: 6, hour: 7, code: '24GEP51' }, // Others
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = config.databaseUrl || 'mongodb://localhost:27017/attendance_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    // 1. Department
    let dept = await Department.findOne({ code: 'ECE' });
    if (!dept) {
      dept = await Department.create({
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        hodName: 'Dr. T. Meeradevi',
        hodEmail: 'meeradevi@kongu.ac.in',
        isActive: true,
      });
    }

    // 2. Class
    let eceClass = await Class.findOne({ name: 'ECE III Year - Section D' });
    if (!eceClass) {
      eceClass = await Class.create({
        name: 'ECE III Year - Section D',
        departmentId: dept._id,
        year: 3,
        sections: ['D'],
        academicYear: '2024-2028',
        isActive: true,
      });
    }

    // 3. Ensure all faculty exist as Teacher and User
    const subjectMap = {};
    for (const def of SUBJECT_DEFS) {
      let user = await User.findOne({ email: def.facultyEmail });
      if (!user) {
        user = await User.create({
          name: def.facultyName,
          email: def.facultyEmail,
          phone: def.phone,
          password: def.facultyEmail,
          role: 'TEACHER',
          accountStatus: 'ACTIVE',
          isActive: true,
        });
      }

      let teacher = await Teacher.findOne({ userId: user._id });
      if (!teacher) {
        teacher = await Teacher.create({
          userId: user._id,
          employeeId: 'KEC_' + def.code,
          name: def.facultyName,
          email: def.facultyEmail,
          departmentId: dept._id,
          designation: 'Faculty Member',
          phone: def.phone,
          cabinNumber: def.room,
          classes: [eceClass._id],
          isActive: true,
        });
      }

      let subject = await Subject.findOne({ code: def.code });
      if (subject) {
        subject.name = def.name;
        subject.type = def.type;
        subject.teacherId = teacher._id;
        subject.classIds = [eceClass._id];
        await subject.save();
      } else {
        subject = await Subject.create({
          code: def.code,
          name: def.name,
          departmentId: dept._id,
          classIds: [eceClass._id],
          type: def.type,
          teacherId: teacher._id,
          isActive: true,
        });
      }

      subjectMap[def.code] = {
        subject,
        teacher,
      };
    }

    // 4. Clear old timetable and re-populate with exact Official ECE-D Weekly Grid
    console.log('Clearing old timetable and seeding official ECE-D schedule...');
    await Timetable.deleteMany({ classId: eceClass._id });

    let count = 0;
    for (const entry of TIMETABLE_GRID) {
      const mapping = subjectMap[entry.code];
      if (!mapping) continue;

      const timing = PERIOD_TIMES[entry.hour] || { startTime: '08:45 AM', endTime: '09:35 AM' };

      await Timetable.create({
        classId: eceClass._id,
        dayOfWeek: entry.day,
        hour: entry.hour,
        subjectId: mapping.subject._id,
        teacherId: mapping.teacher._id,
        startTime: timing.startTime,
        endTime: timing.endTime,
        academicYear: '2024-2028',
        isActive: true,
      });

      count++;
    }

    console.log(`\n🎉 SUCCESS: ${count} official periods seeded for ECE III Year - Section D!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding timetable:', err);
    process.exit(1);
  }
}

seed();
