import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@mymail.mapua.edu.ph')) {
      setError('Access restricted to valid @mymail.mapua.edu.ph accounts.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulating network latency
      await new Promise(resolve => setTimeout(resolve, 1200));
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials or server error. Please try again.');
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
      <div className="flex w-full max-w-5xl min-h-[600px] bg-white/80 backdrop-blur-xl border border-white/70 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Brand Showcase Panel */}
        <div className="hidden lg:flex w-[45%] bg-[#991b1b] p-14 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-[#ffc000]/10 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-[#ffc000] rounded-lg"></div>
            <span className="font-extrabold text-xl tracking-tight">MUDRRS</span>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Discussion Room <br /> Reservation
            </h1>
            <p className="text-[0.95rem] leading-relaxed text-red-200">
              The official, centralized platform for booking and managing study sessions across Mapúa University Libraries.
            </p>
          </div>
          
          <div className="text-xs font-medium text-white/40 tracking-wider uppercase relative z-10">
            Mapúa University Library Service
          </div>
        </div>

        {/* Right Interactive Input Side */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="flex lg:hidden items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#991b1b] rounded-lg"></div>
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">MUDRRS</span>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="mb-9">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Sign In</h2>
              <p className="text-sm text-gray-500">Please enter your institutional MyMapúa credentials.</p>
            </div>

            <form onSubmit={handleLogin} autoComplete="off" className="space-y-6">
              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">MyMapúa Email</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"></path></svg>
                  <input type="email" id="email" placeholder="username@mymail.mapua.edu.ph" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border ${error && email.length > 0 ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all`} />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <input type="password" id="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#991b1b] focus:ring-4 focus:ring-[#991b1b]/10 outline-none transition-all" />
                </div>
              </div>

              {/* Error Message Layout Frame */}
              <div className="min-h-[1.5rem] flex items-center">
                {error && <span className="text-sm font-medium text-red-600">{error}</span>}
              </div>

              {/* Sign In Button */}
              <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl text-[0.938rem] font-bold shadow-lg shadow-[#991b1b]/20 transition-all group">
                <span>{isLoading ? 'Verifying Identity...' : 'Sign In with MyMapúa'}</span>
                {!isLoading && (
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                )}
              </button>

              {/* UPDATED: Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  Don't have an account yet?{' '}
                  <Link 
                    to="/signup" 
                    className="text-[#991b1b] hover:text-[#7f1d1d] font-bold hover:underline transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};