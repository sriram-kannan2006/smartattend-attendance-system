const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
require('./models');

const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Department = require('./models/Department');
const Class = require('./models/Class');

const FACULTY_LIST = [
  { name: 'Dr. D. Murugesan', email: 'gmece@kongu.ac.in', designation: 'Senior Professor & Dean' },
  { name: 'Dr. N. Kasthuri', email: 'kasthuri@kongu.ac.in', designation: 'Senior Professor' },
  { name: 'Dr. T. Meeradevi', email: 'meeradevi@kongu.ac.in', designation: 'Senior Professor & Head' },
  { name: 'Dr. P. Nirmala devi', email: 'nirmaladevi@kongu.ac.in', designation: 'Professor' },
  { name: 'Dr. D. Malathi', email: 'malathy@kongu.ac.in', designation: 'Professor' },
  { name: 'Dr. P. Sivaranjani', email: 'sivaranjani@kongu.ac.in', designation: 'Professor' },
  { name: 'Dr. Maheswaran S', email: 'mmaheswaran_eie@kongu.ac.in', designation: 'Professor' },
  { name: 'Dr. S. Sasikala', email: 'sasikalas@kongu.ac.in', designation: 'Professor' },
  { name: 'Dr. SenthilKumar A', email: 'skumar.ece@kongu.ac.in', designation: 'Professor of Practice' },
  { name: 'Dr. J. Vijayalakshmi', email: 'vijayalakshmi@kongu.ac.in', designation: 'Associate Professor' },
  { name: 'Dr. K. Senthil Kumar', email: 'ksenthilkumar@kongu.ac.in', designation: 'Associate Professor' },
  { name: 'Dr. A. Arulmurugan', email: 'arul@kongu.ac.in', designation: 'Associate Professor' },
  { name: 'Dr. K. Manoj Senthil', email: 'kmanojsenthil@kongu.ac.in', designation: 'Associate Professor' },
  { name: 'Dr. K. Kavin Kumar', email: 'kavinkumar.ece@kongu.edu', designation: 'Associate Professor' },
  { name: 'Dr. A. CHANDRASEKARAN', email: 'chandru@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'Vibin Mammen Vinod', email: 'vibin@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'Mekala V', email: 'mekalav@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'ANBUMANI V', email: 'anbumani.ece@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'SATHESH S', email: 'sathesh.ece@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'Dr. R. Ramyea', email: 'ramyea.ece@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'Dr. R. P. Karthik', email: 'rpkarthik.ece@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'Dr. M. PAVITHRA', email: 'mpavithra.ece@kongu.ac.in', designation: 'Assistant Professor(SLG)' },
  { name: 'G. DEEPA', email: 'g.deepa@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'Dr. N. S. Kavitha', email: 'nskavitha@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'B. Vivek', email: 'vivek.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'Preethi S', email: 'preethi.s@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'A. Vennila', email: 'vennila.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'Dr. SUTHAGAR S', email: 'suthagar.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'G. THIRUNAVUKKARASU', email: 'gthiru.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'Dr. G. Sivapriya', email: 'sivapriya.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'INDHUMATHI N', email: 'indhumathi.ece@kongu.ac.in', designation: 'Assistant Professor(SRG)' },
  { name: 'PAVITHARA P', email: 'ppavithara.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'P. Gowri', email: 'gowri.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Banumithra B', email: 'banumithra.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'M. Ramesh', email: 'ramesh.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'M. Ponkarthika', email: 'ponkarthika.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'B. Abinaya', email: 'abinaya.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Saranya M', email: 'saranya.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Dr. B. T. ANNAPOORANI', email: 'annapoorani.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Dr. Arulmurugan S', email: 'arulmurugan.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Dr. T. Abirami', email: 'abirami.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'M. VIGNESH', email: 'vignesh.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Dr. S. Sudha', email: 'sudha.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Dr. Prabhu T', email: 'prabhu.eee@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Ms. K. Kodeeswari', email: 'kodeeswari.ece@kongu.edu', designation: 'Assistant Professor' },
  { name: 'M. Shivaranjani', email: 'shivaranjani.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Mrs. D. Gowthami', email: 'gowthami.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Vidhya S', email: 'vidhyas.ece@kongu.ac.in', designation: 'Assistant Professor' },
  { name: 'Kannan Sriram (Admin & Faculty)', email: 'kannansriram0910@gmail.com', designation: 'Faculty & Admin' },
  { name: 'Demo Faculty', email: 'teacher@kongu.edu', designation: 'Demo Faculty' }
];

async function syncAllFaculty() {
  await mongoose.connect(config.databaseUrl);
  console.log('Connected to DB');

  const dept = await Department.findOne({ code: 'ECE' }) || await Department.findOne();
  const eceClass = await Class.findOne({ departmentId: dept?._id }) || await Class.findOne();

  let updatedCount = 0;
  for (const fac of FACULTY_LIST) {
    const cleanEmail = fac.email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: fac.name,
        email: cleanEmail,
        phone: '9876543210',
        password: 'password123',
        role: 'TEACHER',
        accountStatus: 'ACTIVE',
        isActive: true,
      });
      console.log('Created User:', fac.name, cleanEmail);
    } else {
      user.name = fac.name;
      user.role = user.role === 'ADMIN' ? 'ADMIN' : 'TEACHER';
      user.password = 'password123';
      user.accountStatus = 'ACTIVE';
      user.isActive = true;
      await user.save();
      console.log('Updated User Password:', fac.name, cleanEmail);
    }

    let teacher = await Teacher.findOne({ email: cleanEmail }) || await Teacher.findOne({ userId: user._id });
    if (!teacher) {
      await Teacher.create({
        userId: user._id,
        name: fac.name,
        email: cleanEmail,
        departmentId: dept?._id,
        classes: eceClass ? [eceClass._id] : [],
        isActive: true,
      });
      console.log('Created Teacher Profile for:', fac.name);
    } else {
      teacher.name = fac.name;
      teacher.userId = user._id;
      teacher.email = cleanEmail;
      teacher.isActive = true;
      if (eceClass && (!teacher.classes || teacher.classes.length === 0)) {
        teacher.classes = [eceClass._id];
      }
      await teacher.save();
    }
    updatedCount++;
  }

  console.log('Successfully synced and updated passwords for all ' + updatedCount + ' faculty members!');
  process.exit(0);
}

syncAllFaculty().catch(e => { console.error('Error:', e); process.exit(1); });
