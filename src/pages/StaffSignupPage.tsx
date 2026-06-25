import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const StaffSignupPage: React.FC = () => {
  const [staffId, setStaffId] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [assignedCampus, setAssignedCampus] = useState<string>('Makati');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successEmail, setSuccessEmail] = useState<string>('');
  
  const navigate = useNavigate();
  const { signUpStaff } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation 1: Password Match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    // Validation 2: Password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Validation 3: Staff ID
    if (!staffId.trim()) {
      setError('Staff ID is required.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUpStaff(
        email,
        password,
        staffId.trim(),
        firstName.trim(),
        lastName.trim(),
        assignedCampus
      );

      if (signUpError) {
        setError(signUpError);
        return;
      }
      
      setSuccessEmail(email);
      setShowSuccessModal(true);
      
    } catch (err) {
      setError('Server error during registration. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-gray-100 relative overflow-hidden font-sans">
      
      {/* Background Visual Anchors */}
      <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-[#ffc000] blur-[120px] opacity-20 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] bg-[#991b1b] blur-[120px] opacity-10 rounded-full pointer-events-none"></div>

      {/* Glassmorphism Frame Wrapper */}
      <div className="flex w-full max-w-5xl min-h-[650px] bg-white/80 backdrop-blur-xl border border-white/70 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Brand Showcase Panel */}
        <div className="hidden lg:flex w-[45%] bg-[#991b1b] p-14 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-[#ffc000]/10 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-[#ffc000] rounded-lg"></div>
            <span className="font-extrabold text-xl tracking-tight">MUDRRS</span>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Staff <br /> Registration
            </h1>
            <p className="text-[0.95rem] leading-relaxed text-red-200">
              Set up a staff account to manage the Mapúa University Discussion Room Reservation System.
            </p>
          </div>
          
          <div className="text-xs font-medium text-white/40 tracking-wider uppercase relative z-10">
            Mapúa University Library Service
          </div>
        </div>

        {/* Right Interactive Input Side */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto">
          
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#991b1b] rounded-lg"></div>
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">MUDRRS</span>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create Staff Account</h2>
              <p className="text-sm text-gray-500">Register library staff credentials.</p>
            </div>

            <form onSubmit={handleSignup} autoComplete="off" className="space-y-5">
              
              {/* 2-Column Grid for Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</label>
                  <input type="text" id="firstName" placeholder="Juan" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</label>
                  <input type="text" id="lastName" placeholder="Dela Cruz" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
              </div>

              {/* Staff ID Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="staffId" className="text-sm font-semibold text-gray-700">Staff ID</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 0 0 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                  </svg>
                  <input type="text" id="staffId" placeholder="STF-2020-0001" required value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
              </div>

              {/* Assigned Campus Dropdown */}
              <div className="flex flex-col gap-2">
                <label htmlFor="assignedCampus" className="text-sm font-semibold text-gray-700">Assigned Campus</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <select id="assignedCampus" required value={assignedCampus} onChange={(e) => setAssignedCampus(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all appearance-none cursor-pointer">
                    <option value="Makati">Makati</option>
                    <option value="Intramuros">Intramuros</option>
                  </select>
                  <svg className="absolute right-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"></path>
                  </svg>
                  <input type="email" id="email" placeholder="staff@mapua.edu.ph" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
              </div>

              {/* 2-Column Grid for Passwords */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
                  <input type="password" id="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm</label>
                  <input type="password" id="confirmPassword" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-4 py-3.5 bg-gray-50 border ${error.includes('match') ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all`} />
                </div>
              </div>

              {/* Error Message */}
              <div className="min-h-[1.5rem] flex items-center">
                {error && <span className="text-sm font-medium text-red-600">{error}</span>}
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl text-[0.938rem] font-bold shadow-lg shadow-[#991b1b]/20 transition-all group">
                <span>{isLoading ? 'Creating Staff Account...' : 'Register Staff Account'}</span>
                {!isLoading && (
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                )}
              </button>

              {/* Switch to Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/" className="text-[#991b1b] hover:text-[#7f1d1d] font-bold hover:underline transition-colors">
                    Sign In here
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center relative animate-[fadeIn_0.3s_ease-out]">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Staff Account Created!</h3>

            {/* Message */}
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              A staff account for <strong className="text-gray-700">{successEmail}</strong> has been successfully created.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              You can now sign in with your credentials.
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#991b1b] hover:bg-[#7f1d1d] text-white py-3.5 px-6 rounded-xl text-[0.938rem] font-bold shadow-lg shadow-[#991b1b]/20 transition-all"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSignupPage;
