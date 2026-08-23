export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  WARDEN: 'WARDEN'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  OD: 'OD',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
};

export const FACE_STATUS = {
  REGISTERED: 'REGISTERED',
  DISABLED: 'DISABLED',
  REQUIRES_REREGISTRATION: 'REQUIRES_REREGISTRATION'
};

export const SESSION_STATUS = {
  CREATED: 'CREATED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

export const OD_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Students', path: '/admin/students', icon: 'GraduationCap' },
    { label: 'Teachers', path: '/admin/teachers', icon: 'Users' },
    { label: 'Parents', path: '/admin/parents', icon: 'UserCircle' },
    { label: 'Wardens', path: '/admin/wardens', icon: 'ShieldCheck' },
    { label: 'Departments', path: '/admin/departments', icon: 'Building2' },
    { label: 'Classes', path: '/admin/classes', icon: 'BookOpen' },
    { label: 'Subjects', path: '/admin/subjects', icon: 'BookMarked' },
    { label: 'Timetable', path: '/admin/timetable', icon: 'CalendarDays' },
    { label: 'Face Registration', path: '/admin/face-registration', icon: 'ScanFace' },
    { label: 'Attendance', path: '/admin/attendance', icon: 'ClipboardCheck' },
    { label: 'OD Management', path: '/admin/od-management', icon: 'FileText' },
    { label: 'Reports', path: '/admin/reports', icon: 'BarChart3' },
    { label: 'Notifications', path: '/admin/notifications', icon: 'Bell' },
    { label: 'Settings', path: '/admin/settings', icon: 'Settings' }
  ],
  [ROLES.TEACHER]: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: 'LayoutDashboard' },
    { label: 'Today\'s Classes', path: '/teacher/classes', icon: 'CalendarDays' },
    { label: 'Attendance Sessions', path: '/teacher/sessions', icon: 'Camera' },
    { label: 'Students', path: '/teacher/students', icon: 'Users' },
    { label: 'OD', path: '/teacher/od', icon: 'FileText' },
    { label: 'Attendance History', path: '/teacher/history', icon: 'ClipboardList' },
    { label: 'Reports', path: '/teacher/reports', icon: 'BarChart3' },
    { label: 'Notifications', path: '/teacher/notifications', icon: 'Bell' },
    { label: 'Profile', path: '/teacher/profile', icon: 'User' }
  ],
  [ROLES.STUDENT]: [
    { label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
    { label: 'Mark Attendance', path: '/student/mark-attendance', icon: 'ScanFace' },
    { label: 'Attendance History', path: '/student/history', icon: 'ClipboardList' },
    { label: 'Subject Attendance', path: '/student/subject-attendance', icon: 'BookOpen' },
    { label: 'Timetable', path: '/student/timetable', icon: 'CalendarDays' },
    { label: 'OD', path: '/student/od', icon: 'FileText' },
    { label: 'Notifications', path: '/student/notifications', icon: 'Bell' },
    { label: 'Profile', path: '/student/profile', icon: 'User' }
  ],
  [ROLES.PARENT]: [
    { label: 'Dashboard', path: '/parent/dashboard', icon: 'LayoutDashboard' },
    { label: 'Student Attendance', path: '/parent/student-attendance', icon: 'ClipboardCheck' },
    { label: 'Daily Attendance', path: '/parent/daily-attendance', icon: 'CalendarDays' },
    { label: 'Subject Attendance', path: '/parent/subject-attendance', icon: 'BookOpen' },
    { label: 'Absence History', path: '/parent/absence-history', icon: 'History' },
    { label: 'Notifications', path: '/parent/notifications', icon: 'Bell' },
    { label: 'Profile', path: '/parent/profile', icon: 'User' }
  ],
  [ROLES.WARDEN]: [
    { label: 'Dashboard', path: '/warden/dashboard', icon: 'LayoutDashboard' },
    { label: 'Hostel Attendance', path: '/warden/attendance', icon: 'Home' },
    { label: 'Absent Students', path: '/warden/absent', icon: 'UserX' },
    { label: 'OD Students', path: '/warden/od', icon: 'FileText' },
    { label: 'Attendance History', path: '/warden/history', icon: 'History' },
    { label: 'Notifications', path: '/warden/notifications', icon: 'Bell' },
    { label: 'Profile', path: '/warden/profile', icon: 'User' }
  ]
};

export const STATUS_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]: 'bg-success-100 text-success-700',
  [ATTENDANCE_STATUS.ABSENT]: 'bg-error-100 text-error-700',
  [ATTENDANCE_STATUS.OD]: 'bg-info-100 text-info-700',
  [ATTENDANCE_STATUS.LATE]: 'bg-warning-100 text-warning-700',
  [ATTENDANCE_STATUS.EXCUSED]: 'bg-secondary-100 text-secondary-700',
  
  [OD_STATUS.PENDING]: 'bg-warning-100 text-warning-700',
  [OD_STATUS.APPROVED]: 'bg-success-100 text-success-700',
  [OD_STATUS.REJECTED]: 'bg-error-100 text-error-700',
  [OD_STATUS.CANCELLED]: 'bg-secondary-100 text-secondary-700',
  
  [SESSION_STATUS.ACTIVE]: 'bg-success-100 text-success-700',
  [SESSION_STATUS.CLOSED]: 'bg-secondary-100 text-secondary-700',
  [SESSION_STATUS.EXPIRED]: 'bg-error-100 text-error-700'
};
