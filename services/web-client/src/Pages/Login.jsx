import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login,refresh } from '../Services/AuthService';

const Login = ({setIsLoading}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simulate login and redirect to home
    setIsLoading(true)
    await login(navigate,email,password)
    setIsLoading(false)
  };
 useEffect(
  ()=>{
    (async ()=>{
    setIsLoading(true)
      await refresh(navigate,"/home")
    setIsLoading(false)
    })()
  }
,[])
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      {/* Background Glows for Dark Mode */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full dark:block hidden" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full dark:block hidden" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-600">
            nexuSTream
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Welcome back, Streamer</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-50">Username</label>
              <input 
                type="name" 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all text-slate-200"
                placeholder="username123"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-50">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all text-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </form>

        </div>

        <p className="text-center mt-8 text-sm text-zinc-500">
          Don't have an account? <Link to="/register" className="text-blue-500 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;