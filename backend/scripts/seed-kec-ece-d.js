const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Models
const User = require('../models/User');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const FaceProfile = require('../models/FaceProfile');

const ECE_D_STUDENTS = [
  { regNo: '24ECR177', name: 'SARAN K N', gender: 'MALE', email: 'sarankn.24ece@kongu.edu', phone: '8300380302' },
  { regNo: '24ECR179', name: 'SARAN N V', gender: 'MALE', email: 'sarannv.24ece@kongu.edu', phone: '6382972146' },
  { regNo: '24ECR180', name: 'SARATHI G', gender: 'MALE', email: 'sarathig.24ece@kongu.edu', phone: '9585231520' },
  { regNo: '24ECR181', name: 'SARVIKA S', gender: 'FEMALE', email: 'sarvikas.24ece@kongu.edu', phone: '8870506069' },
  { regNo: '24ECR182', name: 'SELVAKUMARI M', gender: 'FEMALE', email: 'selvakumarim.24ece@kongu.edu', phone: '9500918663' },
  { regNo: '24ECR183', name: 'SELVALAKSHITHA S', gender: 'FEMALE', email: 'selvalakshithas.24ece@kongu.edu', phone: '8015920878' },
  { regNo: '24ECR184', name: 'SENTHAMILPRIYAN V', gender: 'MALE', email: 'senthamilpriyanv.24ece@kongu.edu', phone: '9360345764' },
  { regNo: '24ECR185', name: 'SERISHRAJ M', gender: 'MALE', email: 'serishraj.24ece@kongu.edu', phone: '8072849436' },
  { regNo: '24ECR186', name: 'SESHAN R', gender: 'MALE', email: 'seshanr.24ece@kongu.edu', phone: '9894543153' },
  { regNo: '24ECR187', name: 'SHANMUGA PRIYA S', gender: 'FEMALE', email: 'shanmugapriyas.24ece@kongu.edu', phone: '8668107198' },
  { regNo: '24ECR188', name: 'SHARVESH A Y', gender: 'MALE', email: 'sharveshay.24ece@kongu.edu', phone: '9361191110' },
  { regNo: '24ECR189', name: 'SHARVESHWARR K B', gender: 'MALE', email: 'sharveshwarrkb.24ece@kongu.edu', phone: '9842464429' },
  { regNo: '24ECR190', name: 'SHIVA PRAKASAM K A', gender: 'MALE', email: 'shivaprakasamka.24ece@kongu.edu', phone: '9487663549' },
  { regNo: '24ECR191', name: 'SHWETHA T', gender: 'FEMALE', email: 'shwethat.24ece@kongu.edu', phone: '6369520699' },
  { regNo: '24ECR192', name: 'SIVAKUMAR V', gender: 'MALE', email: 'sivakumarv.24ece@kongu.edu', phone: '9360531008' },
  { regNo: '24ECR193', name: 'SOUNDAAR S', gender: 'MALE', email: 'soundaars.24ece@kongu.edu', phone: '9363717878' },
  { regNo: '24ECR194', name: 'SOWMIYA K', gender: 'FEMALE', email: 'sowmiyak.24ece@kongu.edu', phone: '8778148454' },
  { regNo: '24ECR195', name: 'SRENIDHI G P', gender: 'FEMALE', email: 'srenidhigp.24ece@kongu.edu', phone: '8248011709' },
  { regNo: '24ECR196', name: 'SRIDHAR R', gender: 'MALE', email: 'sridharr.24ece@kongu.edu', phone: '9524027027' },
  { regNo: '24ECR197', name: 'SRINITHI M', gender: 'FEMALE', email: 'srinithim.24ece@kongu.edu', phone: '8122858146' },
  { regNo: '24ECR198', name: 'SRIRAM KANNAN S', gender: 'MALE', email: 'sriramkannans.24ece@kongu.edu', phone: '9363267561' },
  { regNo: '24ECR199', name: 'SRISHANTH P', gender: 'MALE', email: 'srishanthp.24ece@kongu.edu', phone: '9629493600' },
  { regNo: '24ECR200', name: 'SUBASH S', gender: 'MALE', email: 'subashs.24ece@kongu.edu', phone: '9080003971' },
  { regNo: '24ECR201', name: 'SUBHASREE K', gender: 'FEMALE', email: 'subhasreek.24ece@kongu.edu', phone: '6369821064' },
  { regNo: '24ECR202', name: 'SUBIRAJ B', gender: 'MALE', email: 'subirajb.24ece@kongu.edu', phone: '8825572243' },
  { regNo: '24ECR203', name: 'SUDALAIMANI P', gender: 'MALE', email: 'sudalaimanip.24ece@kongu.edu', phone: '9047157396' },
  { regNo: '24ECR204', name: 'SUDARSHAN S P', gender: 'MALE', email: 'sudarshansp.24ece@kongu.edu', phone: '7448667677' },
  { regNo: '24ECR205', name: 'SUDHAKARAN S', gender: 'MALE', email: 'sudhakarans.24ece@kongu.edu', phone: '8973393837' },
  { regNo: '24ECR206', name: 'SUDHAN M D', gender: 'MALE', email: 'sudhanmd.24ece@kongu.edu', phone: '9361380090' },
  { regNo: '24ECR207', name: 'SUDHARSHINI A', gender: 'FEMALE', email: 'sudharshinia.24ece@kongu.edu', phone: '6382145376' },
  { regNo: '24ECR208', name: 'SUGANTH S', gender: 'MALE', email: 'suganths.24ece@kongu.edu', phone: '8754220113' },
  { regNo: '24ECR209', name: 'SUGESH P V', gender: 'MALE', email: 'sugeshpv.24ece@kongu.edu', phone: '9363642161' },
  { regNo: '24ECR210', name: 'SUJAI S', gender: 'MALE', email: 'sujais.24ece@kongu.edu', phone: '9363414403' },
  { regNo: '24ECR211', name: 'SUJITHA B', gender: 'FEMALE', email: 'sujithab.24ece@kongu.edu', phone: '9344955941' },
  { regNo: '24ECR212', name: 'SUNMATHI S', gender: 'FEMALE', email: 'sunmathis.24ece@kongu.edu', phone: '7904881048' },
  { regNo: '24ECR213', name: 'SUPRITHA B', gender: 'FEMALE', email: 'suprithab.24ece@kongu.edu', phone: '7397386772' },
  { regNo: '24ECR214', name: 'SURYA AVINASH S', gender: 'MALE', email: 'suryaavinashs.24ece@kongu.edu', phone: '8072472252' },
  { regNo: '24ECR215', name: 'SURYA J', gender: 'MALE', email: 'suryaj.24ece@kongu.edu', phone: '8220235317' },
  { regNo: '24ECR216', name: 'SUVETHA K', gender: 'FEMALE', email: 'suvethak.24ece@kongu.edu', phone: '7010695474' },
  { regNo: '24ECR217', name: 'TAMILSELVAN R', gender: 'MALE', email: 'tamilselvanr.24ece@kongu.edu', phone: '6374669022' },
  { regNo: '24ECR218', name: 'TARUN G S', gender: 'MALE', email: 'tarungs.24ece@kongu.edu', phone: '9751255140' },
  { regNo: '24ECR219', name: 'TEJASH KUMAR S', gender: 'MALE', email: 'tejashkumars.24ece@kongu.edu', phone: '7667722626' },
  { regNo: '24ECR220', name: 'THAHATHOUSIF S', gender: 'MALE', email: 'thahathousifs.24ece@kongu.edu', phone: '6374673685' },
  { regNo: '24ECR221', name: 'THAMARAISELVAN K', gender: 'MALE', email: 'thamaraiselvank.24ece@kongu.edu', phone: '9585702041' },
  { regNo: '24ECR222', name: 'THEJASHREE T', gender: 'FEMALE', email: 'thejashreet.24ece@kongu.edu', phone: '9176767173' },
  { regNo: '24ECR223', name: 'THENNARASU G', gender: 'MALE', email: 'thennarasug.24ece@kongu.edu', phone: '7395820224' },
  { regNo: '24ECR224', name: 'THULASIDHARAN K S', gender: 'MALE', email: 'thulasidharanks.24ece@kongu.edu', phone: '9344456461' },
  { regNo: '24ECR225', name: 'VAISHNAV S', gender: 'MALE', email: 'vaishnavs.24ece@kongu.edu', phone: '7708958168' },
  { regNo: '24ECR226', name: 'VAISHNAVI M A', gender: 'FEMALE', email: 'vaishnavima.24ece@kongu.edu', phone: '9363962902' },
  { regNo: '24ECR227', name: 'VANITHA SREE G', gender: 'FEMALE', email: 'vanithasreeg.24ece@kongu.edu', phone: '9962106929' },
  { regNo: '24ECR228', name: 'VIGNESH K S', gender: 'MALE', email: 'vigneshks.24ece@kongu.edu', phone: '6383463763' },
  { regNo: '24ECR229', name: 'VIGNESH M', gender: 'MALE', email: 'vigneshm.24ece@kongu.edu', phone: '9025995537' },
  { regNo: '24ECR230', name: 'VIJAYAKUMAR S', gender: 'MALE', email: 'vijayakumars.24ece@kongu.edu', phone: '7604913893' },
  { regNo: '24ECR231', name: 'VIJAYANAND B', gender: 'MALE', email: 'vijayanandb.24ece@kongu.edu', phone: '9363301177' },
  { regNo: '24ECR232', name: 'VIKAS R', gender: 'MALE', email: 'vikasr.24ece@kongu.edu', phone: '7305541551' },
  { regNo: '24ECR233', name: 'VIKASINI S', gender: 'FEMALE', email: 'vikasinis.24ece@kongu.edu', phone: '9597455699' },
  { regNo: '24ECR234', name: 'VIKNESH S', gender: 'MALE', email: 'vikneshs.24ece@kongu.edu', phone: '9342166892' },
  { regNo: '24ECR235', name: 'VISHAL G', gender: 'MALE', email: 'vishalg.24ece@kongu.edu', phone: '8778255251' },
  { regNo: '24ECR236', name: 'VISHAL K K', gender: 'MALE', email: 'vishalkk.24ece@kongu.edu', phone: '8760603128' },
  { regNo: '24ECR237', name: 'VISHNU KUMAR V', gender: 'MALE', email: 'vishnukumarv.24ece@kongu.edu', phone: '9345856715' },
  { regNo: '24ECR238', name: 'VISVANTH P', gender: 'MALE', email: 'visvanthp.24ece@kongu.edu', phone: '6369544226' },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = config.databaseUrl || 'mongodb://localhost:27017/attendance_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // 1. Ensure Department
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

    // 2. Ensure Class: ECE III Year - Section D
    let eceClass = await Class.findOne({ name: 'ECE III Year - Section D' });
    if (!eceClass) {
      eceClass = await Class.findOne({ departmentId: dept._id, year: 3 });
    }
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

    // 3. Remove old student records
    console.log('Resetting and seeding all 61 ECE-D student user accounts with password: 12345678');
    const oldStudents = await Student.find();
    const oldUserIds = oldStudents.map(s => s.userId).filter(Boolean);
    await Student.deleteMany({});
    await FaceProfile.deleteMany({});
    await User.deleteMany({ role: 'STUDENT' });

    let count = 0;
    for (const st of ECE_D_STUDENTS) {
      const email = st.email.toLowerCase().trim();
      const phone = st.phone.replace(/[^0-9]/g, '').slice(-10) || '9876543210';

      const user = await User.create({
        name: st.name,
        email: email,
        phone: phone,
        password: '12345678', // hashed by pre-save
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        passwordChangeRequired: false,
        isActive: true,
      });

      await Student.create({
        userId: user._id,
        registerNumber: st.regNo,
        name: st.name,
        email: email,
        institutionalEmail: email,
        phone: phone,
        departmentId: dept._id,
        classId: eceClass._id,
        section: 'D',
        academicYear: '2024-2028',
        faceRegistered: false,
        isActive: true,
      });

      count++;
    }

    console.log(`\n🎉 SUCCESS: All ${count} official Kongu Engineering College ECE-D students registered!`);
    console.log('All passwords set to: 12345678');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
