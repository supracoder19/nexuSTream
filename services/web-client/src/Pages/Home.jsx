import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVideosByPage } from '../Services/VideoService';

const Home = ({setIsLoading}) => {
  const navigate = useNavigate({setIsLoading});
  
  // Pagination and Data States
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); 
  const [totalPages, setTotalPages] = useState(0);
  const loading=false
  const PAGE_SIZE = 8; 

  // Helper function to format ISO timestamps into a "time ago" format
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    return 'Just now';
  };

  // Helper function to format large numbers (e.g., 1200000 -> 1.2M)
  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };


  useEffect(() => {
    (async ()=>{
    setIsLoading(true)
      const res = await fetchVideosByPage(currentPage,PAGE_SIZE)
      if(res)
      {
      setTotalPages(res.totalPages)
      setVideos(res.videos)
      }
    setIsLoading(false)
    })()
  }, [currentPage]);

  const handlePageChange = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Dynamic Grid Mapping */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-40">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-200 dark:bg-zinc-800 aspect-video rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((vid) => (
            <div 
              key={vid.id} 
              // Passing ID dynamically. Live tag logic can depend on title or a field missing here, 
              // but we fall back safely to tracking dynamic streaming routers via ID.
              onClick={() => navigate(`/watch/${vid.id}`)}
              className="cursor-pointer group relative z-10 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-3 shadow-sm">
                {vid.thumbnailUrl ? (
                  <img 
                    src={vid.thumbnailUrl} 
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    No Thumbnail
                  </div>
                )}
                
                {/* Visual state badges using projection properties */}
                
                
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors" />
              </div>
              
              {/* Text Meta Fields */}
              <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-2 text-sm leading-snug mb-1">
                {vid.title}
              </h3>
              
              <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
                <p>{formatCount(vid.viewCount)} views • {formatTimeAgo(vid.createdAt)}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  👍 {formatCount(vid.likesCount)} likes
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center space-x-2 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                currentPage === index
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;