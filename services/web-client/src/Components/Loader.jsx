import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Centered Structural Container */}
      <div className="relative flex items-center justify-center w-32 h-32">
        
        {/* Outer Ring - Spinning Clockwise */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-900" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        
        {/* Middle Ring - Spinning Counter-Clockwise (Slower) */}
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-purple-500 dark:border-b-purple-400 animate-spin [animation-duration:2s] [animation-direction:reverse]" />
        
        {/* Core Pulsing Glow Orb */}
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center animate-pulse">
          {/* Inner Core Accent */}
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
        </div>
      </div>

      {/* Typography Content */}
      <div className="mt-8 text-center space-y-1">
        <h3 className="text-lg font-black tracking-widest uppercase bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 dark:from-white dark:via-zinc-400 dark:to-white bg-clip-text text-transparent animate-pulse">
          nexuSTream
        </h3>
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
          Loading
        </p>
      </div>
    </div>
  );
};

export default Loader;