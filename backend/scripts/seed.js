/**
 * Seed Script — Populates the database with sample institutional data.
 * Creates: Admin, Teachers, Students, Parents, Wardens, Departments, Classes, Subjects, Timetable, Academic Year, Hostels.
 *
 * Run: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Warden = require('../models/Warden');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const Hostel = require('../models/Hostel');

const seed = async () => {
  try {
    await mongoose.connect(config.databaseUrl);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Parent.deleteMany({}),
      Warden.deleteMany({}),
      Department.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      Timetable.deleteMany({}),
      AcademicYear.deleteMany({}),
      Hostel.deleteMany({}),
    ]);

    // ========== ACADEMIC YEAR ==========
    console.log('📅 Creating academic year...');
    const academicYear = await AcademicYear.create({
      name: '2026-2027',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-05-31'),
      isCurrent: true,
    });

    // ========== DEPARTMENTS ==========
    console.log('🏛️  Creating departments...');
    const departments = await Department.insertMany([
      { name: 'Electronics and Communication Engineering', code: 'ECE' },
      { name: 'Computer Science and Engineering', code: 'CSE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
    ]);
    const [deptECE, deptCSE, deptMECH] = departments;

    // ========== HOSTELS ==========
    console.log('🏠 Creating hostels...');
    const hostels = await Hostel.insertMany([
      { name: 'Men\'s Hostel A', blocks: ['Block 1', 'Block 2', 'Block 3'] },
      { name: 'Women\'s Hostel B', blocks: ['Block 1', 'Block 2'] },
    ]);

    // ========== ADMIN USER ==========
    console.log('👑 Creating admin user...');
    const adminUser = await User.create({
      name: 'Dr. Kumar Rajendran',
      email: 'admin@attendsync.edu',
      phone: '9876543210',
      password: 'Admin@123',
      role: 'ADMIN',
    });

    // ========== TEACHER USERS ==========
    console.log('👨‍🏫 Creating teachers...');
    const teacherData = [
      { name: 'Prof. Anitha Sharma', email: 'anitha@attendsync.edu', phone: '9876543211', dept: deptECE },
      { name: 'Prof. Rajesh Kumar', email: 'rajesh@attendsync.edu', phone: '9876543212', dept: deptECE },
      { name: 'Prof. Priya Venkatesh', email: 'priya@attendsync.edu', phone: '9876543213', dept: deptCSE },
      { name: 'Prof. Suresh Iyer', email: 'suresh@attendsync.edu', phone: '9876543214', dept: deptCSE },
      { name: 'Prof. Lakshmi Narayanan', email: 'lakshmi@attendsync.edu', phone: '9876543215', dept: deptMECH },
    ];

    const teachers = [];
    for (const td of teacherData) {
      const user = await User.create({
        name: td.name, email: td.email, phone: td.phone,
        password: 'Teacher@123', role: 'TEACHER',
      });
      const teacher = await Teacher.create({
        userId: user._id, employeeId: `EMP${String(teachers.length + 1).padStart(3, '0')}`,
        name: td.name, email: td.email, phone: td.phone, departmentId: td.dept._id,
      });
      teachers.push(teacher);
    }

    // ========== CLASSES ==========
    console.log('🏫 Creating classes...');
    const classes = await Class.insertMany([
      { name: 'ECE II Year', departmentId: deptECE._id, year: 2, sections: ['A', 'B'], academicYear: '2026-2027' },
      { name: 'ECE III Year', departmentId: deptECE._id, year: 3, sections: ['A'], academicYear: '2026-2027' },
      { name: 'CSE II Year', departmentId: deptCSE._id, year: 2, sections: ['A', 'B'], academicYear: '2026-2027' },
      { name: 'CSE III Year', departmentId: deptCSE._id, year: 3, sections: ['A'], academicYear: '2026-2027' },
      { name: 'MECH II Year', departmentId: deptMECH._id, year: 2, sections: ['A'], academicYear: '2026-2027' },
      { name: 'MECH III Year', departmentId: deptMECH._id, year: 3, sections: ['A'], academicYear: '2026-2027' },
    ]);

    // ========== SUBJECTS ==========
    console.log('📚 Creating subjects...');
    const subjects = await Subject.insertMany([
      { name: 'Digital Electronics', code: 'EC201', departmentId: deptECE._id, classIds: [classes[0]._id], credits: 4, type: 'THEORY', teacherId: teachers[0]._id },
      { name: 'Signals and Systems', code: 'EC202', departmentId: deptECE._id, classIds: [classes[0]._id], credits: 4, type: 'THEORY', teacherId: teachers[1]._id },
      { name: 'Communication Theory', code: 'EC203', departmentId: deptECE._id, classIds: [classes[0]._id], credits: 3, type: 'THEORY', teacherId: teachers[0]._id },
      { name: 'Mathematics III', code: 'MA201', departmentId: deptECE._id, classIds: [classes[0]._id], credits: 4, type: 'THEORY', teacherId: teachers[1]._id },
      { name: 'Electronics Lab', code: 'EC291', departmentId: deptECE._id, classIds: [classes[0]._id], credits: 2, type: 'LAB', teacherId: teachers[0]._id },
      { name: 'Data Structures', code: 'CS201', departmentId: deptCSE._id, classIds: [classes[2]._id], credits: 4, type: 'THEORY', teacherId: teachers[2]._id },
      { name: 'Operating Systems', code: 'CS202', departmentId: deptCSE._id, classIds: [classes[2]._id], credits: 4, type: 'THEORY', teacherId: teachers[3]._id },
      { name: 'Database Systems', code: 'CS203', departmentId: deptCSE._id, classIds: [classes[2]._id], credits: 3, type: 'THEORY', teacherId: teachers[2]._id },
      { name: 'Thermodynamics', code: 'ME201', departmentId: deptMECH._id, classIds: [classes[4]._id], credits: 4, type: 'THEORY', teacherId: teachers[4]._id },
      { name: 'Fluid Mechanics', code: 'ME202', departmentId: deptMECH._id, classIds: [classes[4]._id], credits: 4, type: 'THEORY', teacherId: teachers[4]._id },
    ]);

    // Update teachers with subjects and classes
    teachers[0].subjects = [subjects[0]._id, subjects[2]._id, subjects[4]._id];
    teachers[0].classes = [classes[0]._id];
    await teachers[0].save();

    teachers[1].subjects = [subjects[1]._id, subjects[3]._id];
    teachers[1].classes = [classes[0]._id];
    await teachers[1].save();

    teachers[2].subjects = [subjects[5]._id, subjects[7]._id];
    teachers[2].classes = [classes[2]._id];
    await teachers[2].save();

    teachers[3].subjects = [subjects[6]._id];
    teachers[3].classes = [classes[2]._id];
    await teachers[3].save();

    teachers[4].subjects = [subjects[8]._id, subjects[9]._id];
    teachers[4].classes = [classes[4]._id];
    await teachers[4].save();

    // ========== TIMETABLE (ECE II Year) ==========
    console.log('📋 Creating timetable...');
    const timetableEntries = [
      // Monday
      { classId: classes[0]._id, dayOfWeek: 1, hour: 1, subjectId: subjects[3]._id, teacherId: teachers[1]._id, startTime: '09:00', endTime: '09:50' },
      { classId: classes[0]._id, dayOfWeek: 1, hour: 2, subjectId: subjects[0]._id, teacherId: teachers[0]._id, startTime: '09:50', endTime: '10:40' },
      { classId: classes[0]._id, dayOfWeek: 1, hour: 3, subjectId: subjects[1]._id, teacherId: teachers[1]._id, startTime: '11:00', endTime: '11:50' },
      { classId: classes[0]._id, dayOfWeek: 1, hour: 4, subjectId: subjects[2]._id, teacherId: teachers[0]._id, startTime: '11:50', endTime: '12:40' },
      // Tuesday
      { classId: classes[0]._id, dayOfWeek: 2, hour: 1, subjectId: subjects[0]._id, teacherId: teachers[0]._id, startTime: '09:00', endTime: '09:50' },
      { classId: classes[0]._id, dayOfWeek: 2, hour: 2, subjectId: subjects[3]._id, teacherId: teachers[1]._id, startTime: '09:50', endTime: '10:40' },
      { classId: classes[0]._id, dayOfWeek: 2, hour: 3, subjectId: subjects[2]._id, teacherId: teachers[0]._id, startTime: '11:00', endTime: '11:50' },
      { classId: classes[0]._id, dayOfWeek: 2, hour: 4, subjectId: subjects[1]._id, teacherId: teachers[1]._id, startTime: '11:50', endTime: '12:40' },
      // Wednesday
      { classId: classes[0]._id, dayOfWeek: 3, hour: 1, subjectId: subjects[1]._id, teacherId: teachers[1]._id, startTime: '09:00', endTime: '09:50' },
      { classId: classes[0]._id, dayOfWeek: 3, hour: 2, subjectId: subjects[2]._id, teacherId: teachers[0]._id, startTime: '09:50', endTime: '10:40' },
      { classId: classes[0]._id, dayOfWeek: 3, hour: 3, subjectId: subjects[0]._id, teacherId: teachers[0]._id, startTime: '11:00', endTime: '11:50' },
      { classId: classes[0]._id, dayOfWeek: 3, hour: 4, subjectId: subjects[3]._id, teacherId: teachers[1]._id, startTime: '11:50', endTime: '12:40' },
      // Thursday (Lab day)
      { classId: classes[0]._id, dayOfWeek: 4, hour: 1, subjectId: subjects[4]._id, teacherId: teachers[0]._id, startTime: '09:00', endTime: '09:50' },
      { classId: classes[0]._id, dayOfWeek: 4, hour: 2, subjectId: subjects[4]._id, teacherId: teachers[0]._id, startTime: '09:50', endTime: '10:40' },
      { classId: classes[0]._id, dayOfWeek: 4, hour: 3, subjectId: subjects[0]._id, teacherId: teachers[0]._id, startTime: '11:00', endTime: '11:50' },
      { classId: classes[0]._id, dayOfWeek: 4, hour: 4, subjectId: subjects[1]._id, teacherId: teachers[1]._id, startTime: '11:50', endTime: '12:40' },
      // Friday
      { classId: classes[0]._id, dayOfWeek: 5, hour: 1, subjectId: subjects[2]._id, teacherId: teachers[0]._id, startTime: '09:00', endTime: '09:50' },
      { classId: classes[0]._id, dayOfWeek: 5, hour: 2, subjectId: subjects[1]._id, teacherId: teachers[1]._id, startTime: '09:50', endTime: '10:40' },
      { classId: classes[0]._id, dayOfWeek: 5, hour: 3, subjectId: subjects[3]._id, teacherId: teachers[1]._id, startTime: '11:00', endTime: '11:50' },
      { classId: classes[0]._id, dayOfWeek: 5, hour: 4, subjectId: subjects[0]._id, teacherId: teachers[0]._id, startTime: '11:50', endTime: '12:40' },
    ];

    for (const entry of timetableEntries) {
      entry.academicYear = '2026-2027';
    }
    await Timetable.insertMany(timetableEntries);

    // ========== STUDENTS ==========
    console.log('🎓 Creating students...');
    const studentNames = [
      'Sriram Krishnan', 'Aishwarya Balaji', 'Karthik Sundaram', 'Divya Priya',
      'Arun Kumar', 'Meena Lakshmi', 'Vijay Shankar', 'Kavitha Raman',
      'Prasanna Venkatesh', 'Deepa Subramanian', 'Ganesh Mohan', 'Revathi Devi',
      'Suresh Babu', 'Anjali Nair', 'Manikandan', 'Preethi Kumar',
      'Rajkumar Yadav', 'Swathi Rangan', 'Harish Chandran', 'Nithya Sri',
      'Bharath Kumar', 'Sindhu Priya', 'Venkatesh Raman', 'Janani Malar',
      'Ashwin Prakash', 'Lavanya Selvan', 'Dinesh Kumar', 'Gayathri Bala',
      'Santhosh Raja', 'Malini Devi', 'Praveen Kumar', 'Ramya Sri',
      'Karthikeyan', 'Sowmya Rani', 'Naveen Raj', 'Kiruthika',
      'Saravanan', 'Dhivya Bharathi', 'Lokesh Kumar', 'Pavithra Devi',
      'Vignesh Ram', 'Sangeetha', 'Mukesh Babu', 'Hemalatha',
      'Senthil Kumar', 'Gomathi Devi', 'Arjun Raj', 'Nandhini Sri',
      'Tamilselvan', 'Kokila Devi',
    ];

    const students = [];
    const parentUsers = [];

    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const regNum = `24ECR${String(i + 100).padStart(3, '0')}`;
      const email = `${name.split(' ')[0].toLowerCase()}${i}@student.edu`;
      const phone = `98765${String(43000 + i)}`;

      // Create parent first (for every 5 students, share a parent — simulating families)
      let parentUserId;
      if (i % 5 === 0) {
        const parentUser = await User.create({
          name: `Parent of ${name}`,
          email: `parent.${name.split(' ')[0].toLowerCase()}${i}@parent.edu`,
          phone: `98764${String(43000 + i)}`,
          password: 'Parent@123',
          role: 'PARENT',
        });
        parentUserId = parentUser._id;
        parentUsers.push(parentUser);
      } else {
        parentUserId = parentUsers[parentUsers.length - 1]?._id;
      }

      const studentUser = await User.create({
        name, email, phone,
        password: 'Student@123',
        role: 'STUDENT',
      });

      const student = await Student.create({
        userId: studentUser._id,
        registerNumber: regNum,
        name, email, phone,
        departmentId: deptECE._id,
        classId: classes[0]._id, // ECE II Year
        section: i < 25 ? 'A' : 'B',
        academicYear: '2026-2027',
        hostelId: i % 3 === 0 ? hostels[0]._id : (i % 3 === 1 ? hostels[1]._id : undefined),
        parentId: parentUserId,
      });

      students.push(student);

      // Create/update parent profile
      if (parentUserId) {
        await Parent.findOneAndUpdate(
          { userId: parentUserId },
          {
            $setOnInsert: {
              name: `Parent of ${name}`,
              email: `parent.${name.split(' ')[0].toLowerCase()}${i}@parent.edu`,
              phone: `98764${String(43000 + i)}`,
            },
            $addToSet: { studentIds: student._id },
          },
          { upsert: true, new: true }
        );
      }
    }

    // ========== WARDENS ==========
    console.log('🛡️  Creating wardens...');
    const wardenData = [
      { name: 'Mr. Ramachandran', email: 'warden1@attendsync.edu', phone: '9876543220', hostelIds: [hostels[0]._id] },
      { name: 'Mrs. Kamala Devi', email: 'warden2@attendsync.edu', phone: '9876543221', hostelIds: [hostels[1]._id] },
    ];

    for (const wd of wardenData) {
      const user = await User.create({
        name: wd.name, email: wd.email, phone: wd.phone,
        password: 'Warden@123', role: 'WARDEN',
      });
      await Warden.create({
        userId: user._id, name: wd.name, email: wd.email,
        phone: wd.phone, hostelIds: wd.hostelIds,
      });
    }

    // ========== SUMMARY ==========
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           SEED COMPLETED SUCCESSFULLY          ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  Admin       : 1  (admin@attendsync.edu)      ║`);
    console.log(`║  Teachers    : ${teacherData.length}                              ║`);
    console.log(`║  Students    : ${studentNames.length}                             ║`);
    console.log(`║  Parents     : ${parentUsers.length}                             ║`);
    console.log(`║  Wardens     : ${wardenData.length}                              ║`);
    console.log(`║  Departments : ${departments.length}                              ║`);
    console.log(`║  Classes     : ${classes.length}                              ║`);
    console.log(`║  Subjects    : ${subjects.length}                             ║`);
    console.log(`║  Timetable   : ${timetableEntries.length} entries                  ║`);
    console.log(`║  Hostels     : ${hostels.length}                              ║`);
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║  LOGIN CREDENTIALS                             ║');
    console.log('║────────────────────────────────────────────────║');
    console.log('║  Admin   : admin@attendsync.edu   / Admin@123 ║');
    console.log('║  Teacher : anitha@attendsync.edu  / Teacher@123║');
    console.log('║  Student : sriram0@student.edu    / Student@123║');
    console.log('║  Parent  : parent.sriram0@parent.edu / Parent@123║');
    console.log('║  Warden  : warden1@attendsync.edu / Warden@123║');
    console.log('╚════════════════════════════════════════════════╝');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
