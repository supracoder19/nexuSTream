import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register,refresh } from '../Services/AuthService';

const Register = ({setIsLoading}) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true)
     await register(navigate,username,password,email)
    setIsLoading(false)
  };
useEffect(
  ()=>{
    (async ()=>{setIsLoading(true);refresh(navigate,"/home");setIsLoading(false);})()
  }
,[])
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md z-10">
        
        {/* Header Block */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-600">
            nexuSTream
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Start streaming and connecting today</p>
        </div>

        {/* Setup Form Box */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl">
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-50">Username</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all text-slate-200 pla"
                placeholder="nexus_creator"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-50">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all text-slate-200 pla"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-50">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none transition-all text-slate-200 pla"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>


            <button 
              type="submit" 
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transform active:scale-95 transition-all cursor-pointer"
            >
              Create Account
            </button>
          </form>

        </div>

        <p className="text-center mt-6 text-sm text-zinc-500">
          Already have an account? <Link to="/login" className="text-blue-500 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;