import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { SocketProvider } from '@/context/SocketContext';

// Layouts
import AuthLayout from '@/components/layout/AuthLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import StudentLogin from '@/pages/auth/StudentLogin';
import Register from '@/pages/auth/Register';
import FaceRegistration from '@/pages/auth/FaceRegistration';
import SecureAccount from '@/pages/student/SecureAccount';
import AuthCallback from '@/pages/auth/AuthCallback';
import ProtectedRoute from '@/pages/auth/ProtectedRoute';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import Departments from '@/pages/admin/Departments';
import Classes from '@/pages/admin/Classes';
import Subjects from '@/pages/admin/Subjects';
import Students from '@/pages/admin/Students';
import Teachers from '@/pages/admin/Teachers';
import Timetable from '@/pages/admin/Timetable';
import FaceRegistrationAdmin from '@/pages/admin/FaceRegistration';
import Settings from '@/pages/admin/Settings';
import AdminReports from '@/pages/admin/Reports';
import NotificationCenter from '@/pages/admin/NotificationCenter';

// Teacher Pages
import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherClasses from '@/pages/teacher/Classes';
import TeacherAttendanceSessions from '@/pages/teacher/AttendanceSessions';
import TeacherStudents from '@/pages/teacher/Students';
import ODApproval from '@/pages/teacher/ODApproval';
import TeacherHistory from '@/pages/teacher/History';
import TeacherReports from '@/pages/teacher/Reports';
import TeacherNotifications from '@/pages/teacher/Notifications';
import TeacherProfile from '@/pages/teacher/Profile';
import AttendanceSession from '@/pages/teacher/AttendanceSession';

// Student Pages
import StudentDashboard from '@/pages/student/Dashboard';
import MarkAttendance from '@/pages/student/MarkAttendance';
import AttendanceHistory from '@/pages/student/AttendanceHistory';
import SubjectAttendance from '@/pages/student/SubjectAttendance';
import ODManagement from '@/pages/student/ODManagement';
import StudentNotifications from '@/pages/student/Notifications';

// Other Dashboards
import ParentDashboard from '@/pages/parent/Dashboard';
import WardenDashboard from '@/pages/warden/Dashboard';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/student/login" replace />} />
            
            {/* Dedicated Student Login Portal */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* General Staff / Admin Login */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Student First-Time Security & Face Enrollment */}
            <Route
              path="/student/secure-account"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <SecureAccount />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/face-registration"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <FaceRegistration />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/face-registration"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <FaceRegistration />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="mark-attendance" element={<MarkAttendance />} />
              <Route path="attendance" element={<MarkAttendance />} />
              <Route path="history" element={<AttendanceHistory />} />
              <Route path="attendance-history" element={<AttendanceHistory />} />
              <Route path="subject-attendance" element={<SubjectAttendance />} />
              <Route path="timetable" element={<StudentDashboard />} />
              <Route path="od" element={<ODManagement />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<Departments />} />
              <Route path="classes" element={<Classes />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="parents" element={<Students />} />
              <Route path="wardens" element={<Students />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="face-registration" element={<FaceRegistrationAdmin />} />
              <Route path="attendance" element={<AdminDashboard />} />
              <Route path="od-management" element={<AdminDashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<NotificationCenter />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<TeacherDashboard />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="today" element={<TeacherClasses />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="session/:id" element={<AttendanceSession />} />
              <Route path="sessions" element={<TeacherAttendanceSessions />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="od" element={<ODApproval />} />
              <Route path="history" element={<TeacherHistory />} />
              <Route path="reports" element={<TeacherReports />} />
              <Route path="notifications" element={<TeacherNotifications />} />
              <Route path="profile" element={<TeacherProfile />} />
            </Route>

            {/* Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={['PARENT']}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<ParentDashboard />} />
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="student-attendance" element={<ParentDashboard />} />
              <Route path="daily-attendance" element={<ParentDashboard />} />
              <Route path="subject-attendance" element={<ParentDashboard />} />
              <Route path="absence-history" element={<ParentDashboard />} />
              <Route path="notifications" element={<ParentDashboard />} />
              <Route path="profile" element={<ParentDashboard />} />
            </Route>

            {/* Warden Routes */}
            <Route path="/warden" element={<ProtectedRoute allowedRoles={['WARDEN']}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<WardenDashboard />} />
              <Route path="dashboard" element={<WardenDashboard />} />
              <Route path="attendance" element={<WardenDashboard />} />
              <Route path="absent" element={<WardenDashboard />} />
              <Route path="od" element={<WardenDashboard />} />
              <Route path="history" element={<WardenDashboard />} />
              <Route path="notifications" element={<WardenDashboard />} />
              <Route path="profile" element={<WardenDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
