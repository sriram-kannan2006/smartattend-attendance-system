import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Hash, BookOpen, GraduationCap, Building2, UserPlus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    phone: '',
    department: 'ECE',
    year: '2',
    section: 'A',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const departmentOptions = [
    { label: 'Electronics & Communication Engg (ECE)', value: 'ECE' },
    { label: 'Computer Science & Engg (CSE)', value: 'CSE' },
    { label: 'Information Technology (IT)', value: 'IT' },
    { label: 'Artificial Intelligence & Data Science (AI&DS)', value: 'AI&DS' },
    { label: 'Electrical & Electronics Engg (EEE)', value: 'EEE' },
    { label: 'Mechanical Engg (MECH)', value: 'MECH' },
    { label: 'Mechatronics Engg (MTS)', value: 'MTS' },
    { label: 'Civil Engg (CIVIL)', value: 'CIVIL' },
    { label: 'Chemical Engg (CHEM)', value: 'CHEM' },
    { label: 'Food Technology (FT)', value: 'FT' },
  ];

  const yearOptions = [
    { label: '1st Year (Batch 2026)', value: '1' },
    { label: '2nd Year (Batch 2025)', value: '2' },
    { label: '3rd Year (Batch 2024)', value: '3' },
    { label: '4th Year (Batch 2023)', value: '4' },
  ];

  const sectionOptions = [
    { label: 'Section A', value: 'A' },
    { label: 'Section B', value: 'B' },
    { label: 'Section C', value: 'C' },
    { label: 'Section D', value: 'D' },
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.registerNumber.trim()) newErrors.registerNumber = 'KEC Register number is required (e.g. 24ECR105)';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Must be 10 digits';
    }
    
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.section) newErrors.section = 'Section is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'STUDENT',
        registerNumber: formData.registerNumber.trim().toUpperCase(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        section: formData.section,
        academicYear: '2026-2027',
      };
      
      await register(payload);
      showSuccess('KEC Student Account created! Proceeding to biometric face enrollment.');
      navigate('/face-registration');
    } catch (error) {
      console.error('Registration error:', error);
      showError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Student Registration" 
      subtitle="Kongu Engineering College — SmartAttend"
    >
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          leftIcon={<User className="h-4 w-4" />}
          placeholder="e.g. Arun Kumar"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="KEC Register Number"
            name="registerNumber"
            type="text"
            required
            value={formData.registerNumber}
            onChange={handleChange}
            error={errors.registerNumber}
            leftIcon={<Hash className="h-4 w-4" />}
            placeholder="24ECR105"
          />

          <Input
            label="Mobile Phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            leftIcon={<Phone className="h-4 w-4" />}
            placeholder="9876543210"
          />
        </div>

        <Input
          label="Student Email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="arunkumar@student.edu"
        />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white truncate"
            >
              {departmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Academic Year</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {yearOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Section</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {sectionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="••••••"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="••••••"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/20 mt-2" 
          isLoading={loading}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Enroll as KEC Student
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
