import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllNotification, markRead } from '../Services/NotificationService';

// High-fidelity Mock Data matching your exact Spring Boot payload structure
const REAL_BACKEND_MOCK_DATA = [
  {
    "id": 2,
    "content": "Your channel was subscribed by supra!",
    "type": "CHANNEL_SUBSCRIBED",
    "videoId": null, // Will NOT trigger navigation when clicked
    "isRead": false,
    "createdAt": "2026-05-28T13:49:02.296961Z",
    "recipient": {
      "id": 1,
      "username": "supra_new",
      "email": "supranew@gmail.com",
      "enabled": true
    }
  },
  {
    "id": 3,
    "content": "supra liked your video React Hooks Guide!",
    "type": "VIDEO_LIKE",
    "videoId": 105, // Will trigger video page navigation when clicked
    "isRead": false,
    "createdAt": "2026-05-28T14:15:22.123456Z",
    "recipient": {
      "id": 1,
      "username": "supra_new"
    }
  },
  {
    "id": 4,
    "content": "New comment from tech_guru: Great explanation on Kafka partitioning setup!",
    "type": "VIDEO_COMMENT",
    "videoId": 202, // Will trigger video page navigation when clicked
    "isRead": true,
    "createdAt": "2026-05-27T09:30:15.000000Z",
    "recipient": {
      "id": 1,
      "username": "supra_new"
    }
  }
];

const NotificationPage = ({setIsLoading}) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  // Dynamic iconography and layouts mapping
  const getNotificationConfig = (type) => {
    switch (type) {
      case 'VIDEO_LIKED':
        return { icon: '❤️', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-100 dark:border-red-900/30' };
      case 'commented':
        return { icon: '💬', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900/30' };
      case 'channel subscribed':
        return { icon: '✨', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-100 dark:border-purple-900/30' };
      default:
        return { icon: '🔔', bg: 'bg-zinc-50 dark:bg-zinc-900/40', border: 'border-zinc-100 dark:border-zinc-800' };
    }
  };

  const formatTime = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleMarkAllAsRead = () => {
    markRead(notifications)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Click handler implementing your exact conditional navigation logic
  const handleNotificationClick = (notif) => {
    // 1. Instantly mark as read locally
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
    );

    // 2. CRITICAL CHANGE: Check if videoId is not null or undefined for redirect routing
    if (notif.videoId !== null && notif.videoId !== undefined) {
      navigate(`/watch/${notif.videoId}`);
    } else {
      console.log("No videoId associated with this notification type. Navigation skipped.");
    }
  };

  // Filter and pagination window calculations
  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : !n.isRead
  );

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    // setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    (async ()=>{
      setIsLoading(true)
        const res = await fetchAllNotification(currentPage-1,itemsPerPage)
        if(res)
        {
            setNotifications(res.content)
            setTotalItems(res.totalElements)
            setTotalPages(res.totalPages)
        }
    setIsLoading(false)
    })()
  }, [currentPage]);
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your alerts, channel tracking subscriptions, and video processing engagements.
          </p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Segmented Filter Control Tab Layout */}
      <div className="flex gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => handleFilterChange('unread')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'unread' 
              ? 'bg-blue-600 text-white' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Main Stream Feed Container */}
      <div className="space-y-3 min-h-[250px]">
        {notifications.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <span className="text-3xl">📭</span>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-3 font-medium">
              {filter === 'all' ? 'Your notification feed is empty.' : 'No unread alerts remaining.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = getNotificationConfig(notif.type);
            const hasVideoLink = notif.videoId !== null && notif.videoId !== undefined;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  notif.isRead 
                    ? 'bg-white dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-800/80 opacity-75 hover:opacity-100' 
                    : `${config.bg} ${config.border} shadow-sm hover:shadow-md`
                } ${hasVideoLink ? 'cursor-pointer ring-1 ring-transparent hover:ring-blue-500/20' : 'cursor-default'}`}
              >
                {/* Active Unread Marker Bar */}
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                )}

                {/* Left Side Styled Icon Box */}
                <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 shadow-sm flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-105">
                  {config.icon}
                </div>

                {/* Body Content Blocks */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Pulls data straight from your 'content' variable */}
                  <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100 font-medium'}`}>
                    {notif.content}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <span>{formatTime(notif.createdAt)}</span>
                    {/* Conditionally reveal redirection visual hints only if an active videoId link exists */}
                    {hasVideoLink && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline cursor-pointer">
                          View video ➔
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Edge Glow Dot */}
                {!notif.isRead && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 mt-2 animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Navigation Elements Block */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-8">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Showing <span className="text-zinc-900 dark:text-zinc-100 font-bold">{notifications.length} <span className="text-zinc-900 dark:text-zinc-100 font-bold"> of {totalItems}</span> items
          </span></span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-sm font-semibold border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-400"
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`w-9 h-9 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentPage === pageNumber
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-sm font-semibold border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-400"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;