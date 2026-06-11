import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { search } from '../Services/ChannelService';

const SearchResults = ({setIsLoading}) => {
  const navigate = useNavigate();
  const {query} = useParams()

  // Mock channels database
  const mockChannels = [
    { id: 'nexus-tech', name: 'Nexus Tech Official', subscribers: '1.2M', description: 'Deep dives into futuristic code structures, Vite setups, and styling architectures.', avatar: '📡' },
    { id: 'stream-gaming', name: 'Stream Gaming Hub', subscribers: '450K', description: 'Daily interactive live streams playing open world and competitive games.', avatar: '🎮' },
    { id: 'design-nexus', name: 'Design Nexus Studio', subscribers: '89K', description: 'Crafting premium user interfaces using micro-interactions and clean styles.', avatar: '🎨' },
  ];

  // Simple client filtering based on the search query
  const [filteredChannels, setFilteredChannels] = useState([]);
  useEffect(() => {
    (async ()=>{
    setIsLoading(true)
      search(query,setFilteredChannels)
    setIsLoading(false)
    })()
  }, [query]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Search results for: <span className="text-blue-500">"{query}"</span></h2>
        <p className="text-xs text-zinc-500 mt-1">{filteredChannels.length} channels found</p>
      </div>

      <div className="space-y-4">
        {filteredChannels.length > 0 ? (
          filteredChannels.map((channel) => (
            <div 
              key={channel.id}
              onClick={() => navigate(`/channel/${channel.id}`)}
              className="flex items-center gap-6 p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:scale-[1.01] hover:border-blue-500/50 transition-all"
            >
              <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center text-3xl shrink-0">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{channel.channelName}</h3>
                <p className="text-xs text-zinc-400 font-medium">{channel.subscriberCount} Subscribers</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{channel.description}</p>
              </div>
              <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-full shrink-0 hover:bg-blue-500 cursor-pointer">
                View Channel
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <span className="text-4xl block mb-2">🤔</span>
            <p className="font-bold text-zinc-500">No channels match your query</p>
            <p className="text-xs text-zinc-400 mt-1">Try searching for "Nexus" or "Stream"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;