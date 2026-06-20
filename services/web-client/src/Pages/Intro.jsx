import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Intro = ({ viewerCount}) => {
  const navigate = useNavigate();
  useEffect(() => {
    console.log(viewerCount);
    
  }, [viewerCount]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-300 relative overflow-hidden">
      
      {/* Top Right Viewers Tab */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Viewers:
        </span>
        <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
          {viewerCount.toLocaleString()}
        </span>
      </div>

      {/* Visual background flares */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-2xl text-center z-10 space-y-8">
        {/* Brand/Logo */}
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter text-blue-600 animate-pulse">
            nexuSTream
          </h1>
          <p className="text-xl font-medium text-zinc-600 dark:text-zinc-300 mt-4">
            The ultimate hub for Live Streams and Content Creators.
          </p>
        </div>

        {/* Feature Teasers */}
        <div className="max-w-lg mx-auto text-left">
          {/* <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <h3 className="font-bold text-blue-500 flex items-center gap-2">📡 Go Live</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Engage with your community in real-time with responsive interactive live chats.</p>
          </div> */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <h3 className="font-bold text-purple-500 flex items-center gap-2">🎬 Share Videos</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Upload crisp, asynchronous recorded content equipped with full feedback systems.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto pt-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
          >
            Sign In
          </button>
          
          <button 
            onClick={() => navigate('/register')}
            className="w-full py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl active:scale-98 transition-all cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Intro;