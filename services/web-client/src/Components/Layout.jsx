
import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout, refresh } from '../Services/AuthService';
import { useDispatch, useSelector } from 'react-redux';
import { editUser } from '../Store/AuthSlice';
import { io } from 'socket.io-client';
import axios from 'axios'; // Ensure axios or your api instance is imported
import { fetchUnreadNotification } from '../Services/NotificationService';
import { toast } from 'react-toastify';

const gateway_api = import.meta.env.VITE_GATEWAY_URL;

const Layout = ({  isDarkMode, setIsDarkMode }) => {
  const [activeMenu, setActiveMenu] = useState(null); // 'profile', 'notif', or null
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState("");

  const navigate = useNavigate();
  const userSlice = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const refresher = useCallback(async () => {
    console.log("Refreshed token at:", new Date().toLocaleString());
    try {
      const data = await refresh(navigate, "", "/login");
      if (data && data[0]) {
        dispatch(editUser({ ...data[0] }));
      }
    } catch (error) {
      console.error("Token refresh failed during background interval:", error);
    }
  }, [navigate, dispatch]);

  // 1. Token Refresh Interval Hook
  useEffect(() => {
    refresher();
    const interval = setInterval(refresher, 1000 * 60 * 13);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Initial History (REST API) & Initialize WebSockets
  useEffect(() => {
    // A. Pull unread notifications history from Core Service
    const fetchNotificationHistory = async () => {
      const res = await fetchUnreadNotification()
      setNotifications(res.content);
      setUnreadCount(() => res.content.length >= 5 ? "5+" : res.content.length)
    };

    fetchNotificationHistory();

    // B. Establish WebSocket connection for Real-Time stream additions
    const socketInstance = io(gateway_api, {
      path: import.meta.env.VITE_GATEWAY_URL,
      withCredentials: true,
    });

    socketInstance.on('notification', (data) => {
      // Prepend the incoming event to state, capping view array at 5 elements
      setNotifications((prev) => [data, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev=="5+" ? "5+" : prev+1)
      toast.info("new notification")
    });


    return () => {
      socketInstance.off('notification');
      socketInstance.disconnect();
      socketInstance.close();
      console.log("Socket disconnected cleanly.");
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${searchQuery}`);
    }
  };

  // 3. Mark Notifications as Read on Menu Open
  const handleToggleNotificationTray = async () => {
    if (activeMenu === 'notif') {
      setActiveMenu(null);
    } else {
      setActiveMenu('notif');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <nav className="flex flex-col md:flex-row md:justify-between md:items-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-50 gap-4">
        
        {/* Top bar container for mobile: holds interactive items and brand title side-by-side */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
          {/* Left Side: Interactive Icons */}
          <div className="flex items-center gap-4">
            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'profile' ? null : 'profile')}
                className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center hover:ring-2 ring-blue-500 transition-all cursor-pointer text-base"
              >
                👤
              </button>
              {activeMenu === 'profile' && (
                <div className="absolute top-12 left-0 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
                  <button onClick={() => { navigate('/dashboard'); setActiveMenu(null); }} className="w-full text-left p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium cursor-pointer">Creator Studio</button>
                  <button onClick={() => { logout(navigate); }} className="w-full text-left p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-red-500 text-sm cursor-pointer">Sign Out</button>
                </div>
              )}
            </div>

            {/* Theme Toggler */}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm cursor-pointer h-10 w-10">
              {isDarkMode ? '🌙' : '☀️'}
            </button>

            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button 
                onClick={handleToggleNotificationTray} 
                className="relative flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm cursor-pointer h-10 w-10"
              >
                🔔
                {unreadCount != "" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center scale-90 border-2 border-white dark:border-zinc-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification List Panel */}
{activeMenu === 'notif' && (
  <div className="fixed md:absolute top-16 md:top-12 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Notifications</span> 
      <span onClick={() => { setNotifications([]); setUnreadCount("") }} className='text-xs p-1 rounded cursor-pointer bg-red-700 hover:bg-red-500 text-white'>clear</span>
    </div>
    
    <div className="max-h-72 overflow-y-auto mt-1 space-y-1">
      {notifications.length === 0 ? (
        <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
          No new updates or alerts.
        </div>
      ) : (
        notifications.map((notif, index) => (
          <div 
            key={index} 
            className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg border-b border-zinc-100/50 dark:border-zinc-800/30 last:border-0 transition-colors flex items-start gap-2 cursor-pointer"
          >
            <span className="text-sm mt-0.5 shrink-0">
              {notif.type === 'VIDEO_LIKED' ? '❤️' : notif.type === 'commented' ? '💬' : '🚀'}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {notif.content}
              </p>
              <span className="text-[10px] text-zinc-400">
                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>
          </div>
        ))
      )}
      
      <div className="px-3 py-2 flex justify-center items-center border-t border-zinc-100 dark:border-zinc-800/50"
        onClick={() => {
          setActiveMenu(null)
          navigate("/notifications")
        }}>
        <span className="text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-500 dark:hover:text-slate-300 text-zinc-400">See all Notification</span>
      </div>
    </div>
  </div>
)}
            </div>
          </div>

          {/* Right Side Brand (Moved here inside the split top-bar on mobile, shifts back on desktop) */}
          <h1 
            onClick={() => { navigate('/home'); setSearchQuery(""); }}
            className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-500 cursor-pointer hover:opacity-80 md:hidden"
          >
            nexuSTream
          </h1>
        </div>

        {/* Center: Search Engine (Now taking up full width safely on mobile) */}
        <form onSubmit={handleSearchSubmit} className="w-full md:flex-1 md:max-w-lg relative order-last md:order-none">
          <input 
            type="text" 
            placeholder="Search channels..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 bg-white dark:text-zinc-500 rounded-2xl p-1 hover:text-blue-500 transition-colors cursor-pointer hover:bg-blue-300">
            🔍
          </button>
        </form>

        {/* Right Side: Brand (Visible only on desktop) */}
        <h1 
          onClick={() => { navigate('/home'); setSearchQuery(""); }}
          className="hidden md:block text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-500 cursor-pointer hover:opacity-80 shrink-0"
        >
          nexuSTream
        </h1>
      </nav>

      <main className="max-w-7xl mx-auto p-6"><Outlet/></main>
    </div>
  );
};

export default Layout;