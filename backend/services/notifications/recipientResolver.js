const Student = require('../../models/Student');
const Parent = require('../../models/Parent');
const Teacher = require('../../models/Teacher');
const Department = require('../../models/Department');
const Warden = require('../../models/Warden');
const User = require('../../models/User');
const Class = require('../../models/Class');

/**
 * Recipient Resolver — Resolves database relationships for notifications.
 * Dynamically resolves Student, Parent, Department, HOD, and Warden entities.
 */
class RecipientResolver {
  /**
   * Resolve student and full academic context.
   * @param {string} studentId - Student MongoDB ObjectId
   */
  async resolveStudent(studentId) {
    const student = await Student.findById(studentId)
      .populate('userId', 'name email phone role')
      .populate('classId', 'name year departmentId')
      .populate('departmentId', 'name code hodId');

    if (!student) return null;

    return {
      student,
      user: student.userId,
      studentId: student._id,
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      phone: student.phone,
      classId: student.classId?._id,
      className: student.classId?.name || 'Class',
      departmentId: student.departmentId?._id || student.classId?.departmentId,
      departmentName: student.departmentId?.name || 'ECE',
      hostelId: student.hostelId,
    };
  }

  /**
   * Resolve parent information for a student.
   * @param {string} studentId - Student MongoDB ObjectId
   */
  async resolveParentForStudent(studentId) {
    const student = await Student.findById(studentId);
    if (!student) return null;

    let parentDoc = null;
    let parentUser = null;

    // 1. Check parentId reference on Student
    if (student.parentId) {
      parentUser = await User.findById(student.parentId);
      parentDoc = await Parent.findOne({ userId: student.parentId });
    }

    // 2. Fallback: Search Parent collection by studentIds array
    if (!parentDoc) {
      parentDoc = await Parent.findOne({ studentIds: student._id }).populate('userId');
      if (parentDoc?.userId) {
        parentUser = parentDoc.userId;
      }
    }

    // 3. Fallback: Lookup by phone or construct proxy parent contact
    const phone = parentDoc?.phone || parentUser?.phone || student.phone;
    const whatsappNumber = parentDoc?.whatsappNumber || phone;
    const email = parentDoc?.email || parentUser?.email;
    const name = parentDoc?.name || parentUser?.name || `Parent of ${student.name}`;
    const parentId = parentUser?._id || parentDoc?._id || student.userId;

    return {
      parentUser,
      parentDoc,
      parentId,
      name,
      phone,
      whatsappNumber,
      email,
      optIn: parentDoc?.whatsappOptIn !== false,
      preferences: parentDoc?.notificationPreferences || { inApp: true, email: true, whatsapp: true },
    };
  }

  /**
   * Resolve Head of Department (HOD) for a department.
   * @param {string} departmentId - Department MongoDB ObjectId
   */
  async resolveHODForDepartment(departmentId) {
    let department = null;
    if (departmentId) {
      department = await Department.findById(departmentId).populate('hodId', 'name email phone role');
    }
    if (!department) {
      department = await Department.findOne({ code: 'ECE' }).populate('hodId', 'name email phone role');
    }
    if (!department) {
      department = await Department.findOne().populate('hodId', 'name email phone role');
    }
    if (!department) return null;

    let hodUser = department.hodId;
    let hodTeacher = null;

    if (hodUser) {
      hodTeacher = await Teacher.findOne({ userId: hodUser._id });
    } else {
      // Fallback: Search Teacher collection for HOD designation or any department teacher
      hodTeacher = await Teacher.findOne({
        $or: [{ departmentId: department._id }, { designation: /HOD/i }, { role: 'HOD' }, { isHod: true }],
      }).populate('userId', 'name email phone role');
      if (hodTeacher?.userId) {
        hodUser = hodTeacher.userId;
      }
    }

    if (!hodUser) return null;

    return {
      hodUser,
      hodTeacher,
      userId: hodUser._id,
      name: hodUser.name,
      email: hodUser.email,
      phone: hodUser.phone,
      departmentName: department.name,
      departmentCode: department.code,
    };
  }

  /**
   * Resolve wardens responsible for a student's hostel.
   * @param {string} studentId - Student MongoDB ObjectId
   */
  async resolveWardensForStudent(studentId) {
    const student = await Student.findById(studentId);
    if (!student || !student.hostelId) return [];

    const wardens = await Warden.find({
      hostelIds: student.hostelId,
      isActive: true,
    }).populate('userId', 'name email phone role');

    return wardens.map((w) => ({
      wardenDoc: w,
      wardenUser: w.userId,
      userId: w.userId?._id,
      name: w.name || w.userId?.name,
      email: w.email || w.userId?.email,
      phone: w.phone || w.userId?.phone,
    }));
  }

  /**
   * Resolve all active administrators.
   */
  async resolveAdmins() {
    const admins = await User.find({ role: 'ADMIN', isActive: true });
    return admins.map((admin) => ({
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
    }));
  }
}

module.exports = new RecipientResolver();
