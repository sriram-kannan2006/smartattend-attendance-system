const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const ECE_FACULTY = [
  { name: 'Dr. D. Murugesan', email: 'gmece@kongu.ac.in', designation: 'Senior Professor & Dean', phone: '9443012345' },
  { name: 'Dr. N. Kasthuri', email: 'kasthuri@kongu.ac.in', designation: 'Senior Professor', phone: '9443012346' },
  { name: 'Dr. T. Meeradevi', email: 'meeradevi@kongu.ac.in', designation: 'Senior Professor & Head', phone: '9443012347' },
  { name: 'Dr. P. Nirmala devi', email: 'nirmaladevi@kongu.ac.in', designation: 'Professor', phone: '9443012348' },
  { name: 'Dr. D. Malathi', email: 'malathy@kongu.ac.in', designation: 'Professor', phone: '9443012349' },
  { name: 'Dr. P. Sivaranjani', email: 'sivaranjani@kongu.ac.in', designation: 'Professor', phone: '9443012350' },
  { name: 'Dr. Maheswaran S', email: 'mmaheswaran_eie@kongu.ac.in', designation: 'Professor', phone: '9443012351' },
  { name: 'Dr. S. Sasikala', email: 'sasikalas@kongu.ac.in', designation: 'Professor', phone: '9443012352' },
  { name: 'Dr. SenthilKumar A', email: 'skumar.ece@kongu.ac.in', designation: 'Professor of Practice', phone: '9443012353' },
  { name: 'Dr. J. Vijayalakshmi', email: 'vijayalakshmi@kongu.ac.in', designation: 'Associate Professor', phone: '9443012354' },
  { name: 'Dr. K. Senthil Kumar', email: 'ksenthilkumar@kongu.ac.in', designation: 'Associate Professor', phone: '9443012355' },
  { name: 'Dr. A. Arulmurugan', email: 'arul@kongu.ac.in', designation: 'Associate Professor', phone: '9443012356' },
  { name: 'Dr. K. Manoj Senthil', email: 'kmanojsenthil@kongu.ac.in', designation: 'Associate Professor', phone: '9443012357' },
  { name: 'Dr. K. Kavin Kumar', email: 'kavinkumar.ece@kongu.edu', designation: 'Associate Professor', phone: '9443012358' },
  { name: 'Dr. A. CHANDRASEKARAN', email: 'chandru@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012359' },
  { name: 'Vibin Mammen Vinod', email: 'vibin@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012360' },
  { name: 'Mekala V', email: 'mekalav@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012361' },
  { name: 'ANBUMANI V', email: 'anbumani.ece@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012362' },
  { name: 'SATHESH S', email: 'sathesh.ece@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012363' },
  { name: 'Dr. R. Ramyea', email: 'ramyea.ece@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012364' },
  { name: 'Dr. R. P. Karthik', email: 'rpkarthik.ece@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012365' },
  { name: 'Dr. M. PAVITHRA', email: 'mpavithra.ece@kongu.ac.in', designation: 'Assistant Professor (SLG)', phone: '9443012366' },
  { name: 'G. DEEPA', email: 'g.deepa@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012367' },
  { name: 'Dr. N. S. Kavitha', email: 'nskavitha@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012368' },
  { name: 'B. Vivek', email: 'vivek.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012369' },
  { name: 'Preethi S', email: 'preethi.s@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012370' },
  { name: 'A. Vennila', email: 'vennila.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012371' },
  { name: 'Dr. SUTHAGAR S', email: 'suthagar.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012372' },
  { name: 'G. THIRUNAVUKKARASU', email: 'gthiru.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012373' },
  { name: 'Dr. G. Sivapriya', email: 'sivapriya.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012374' },
  { name: 'INDHUMATHI N', email: 'indhumathi.ece@kongu.ac.in', designation: 'Assistant Professor (SRG)', phone: '9443012375' },
  { name: 'PAVITHARA P', email: 'ppavithara.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012376' },
  { name: 'P. Gowri', email: 'gowri.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012377' },
  { name: 'Banumithra B', email: 'banumithra.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012378' },
  { name: 'M. Ramesh', email: 'ramesh.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012379' },
  { name: 'M. Ponkarthika', email: 'ponkarthika.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012380' },
  { name: 'B. Abinaya', email: 'abinaya.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012381' },
  { name: 'Saranya M', email: 'saranya.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012382' },
  { name: 'Dr. B. T. ANNAPOORANI', email: 'annapoorani.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012383' },
  { name: 'Dr. Arulmurugan S', email: 'arulmurugan.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012384' },
  { name: 'Dr. T. Abirami', email: 'abirami.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012385' },
  { name: 'M. VIGNESH', email: 'vignesh.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012386' },
  { name: 'Dr. S. Sudha', email: 'sudha.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012387' },
  { name: 'Dr. Prabhu T', email: 'prabhu.eee@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012388' },
  { name: 'Ms. K. Kodeeswari', email: 'kodeeswari.ece@kongu.edu', designation: 'Assistant Professor', phone: '9443012389' },
  { name: 'M. Shivaranjani', email: 'shivaranjani.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012390' },
  { name: 'Mrs. D. Gowthami', email: 'gowthami.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012391' },
  { name: 'Vidhya S', email: 'vidhyas.ece@kongu.ac.in', designation: 'Assistant Professor', phone: '9443012392' },
];

async function seedStaff() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = config.databaseUrl || 'mongodb://localhost:27017/attendance_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

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

    let eceClass = await Class.findOne({ name: 'ECE III Year - Section D' });
    if (!eceClass) {
      eceClass = await Class.findOne({ departmentId: dept._id, year: 3 });
    }

    let subject = await Subject.findOne({ code: '20ECT51' }) || await Subject.findOne({ departmentId: dept._id });
    if (!subject) {
      subject = await Subject.create({
        name: 'Digital Communication Systems',
        code: '20ECT51',
        departmentId: dept._id,
        semester: 5,
        credits: 4,
        type: 'THEORY',
        isActive: true,
      });
    }

    console.log(`\nSeeding ${ECE_FACULTY.length} ECE Faculty / Staff members...`);
    console.log('Default Password for each staff = their exact email ID (e.g. gmece@kongu.ac.in)');

    let count = 0;
    for (const fac of ECE_FACULTY) {
      const email = fac.email.toLowerCase().trim();
      const defaultPassword = email; // email is default password as requested

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: fac.name,
          email: email,
          phone: fac.phone,
          password: defaultPassword,
          role: 'TEACHER',
          accountStatus: 'ACTIVE',
          passwordChangeRequired: false,
          isActive: true,
        });
      } else {
        user.name = fac.name;
        user.password = defaultPassword;
        user.role = 'TEACHER';
        user.isActive = true;
        await user.save();
      }

      let teacher = await Teacher.findOne({ userId: user._id });
      if (!teacher) {
        teacher = await Teacher.create({
          userId: user._id,
          employeeId: `KEC-ECE-${100 + count}`,
          name: fac.name,
          email: email,
          phone: fac.phone,
          departmentId: dept._id,
          designation: fac.designation,
          classes: eceClass ? [eceClass._id] : [],
          subjects: subject ? [subject._id] : [],
          isActive: true,
        });
      } else {
        teacher.name = fac.name;
        teacher.designation = fac.designation;
        teacher.departmentId = dept._id;
        if (eceClass) teacher.classes = [eceClass._id];
        if (subject) teacher.subjects = [subject._id];
        await teacher.save();
      }

      count++;
    }

    console.log(`\n🎉 SUCCESS: ${count} official Kongu Engineering College ECE Staff/Faculty members registered!`);
    console.log('Each staff member can log in using:');
    console.log('Username/Email: their official email (e.g. gmece@kongu.ac.in)');
    console.log('Password: same as their email (e.g. gmece@kongu.ac.in)');

    process.exit(0);
  } catch (err) {
    console.error('Faculty seeding error:', err);
    process.exit(1);
  }
}

seedStaff();
