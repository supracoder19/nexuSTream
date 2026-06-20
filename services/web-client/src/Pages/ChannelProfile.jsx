import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { channelDetails, subscribeChannel, unsubscribeChannel } from '../Services/ChannelService';

const ChannelProfile = ({ setIsLoading }) => {
  const { query } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user)
  // const [channel, setChannel] = useState(
  //   { channelId: 0,channelName: 'Not found', subsrciberCount: '0',  description: 'N/A',subscribed:false, videos: [{ id: 1, title: 'Vite v4 Breakdown & Optimization', viewCount: '0',likesCount:"0", thumbnailUrl:"N/A",createdAt:"2026-05-24T09:20:26.91507" }]}
  // );
  const [channel, setChannel] = useState(
    {
      channelId: 0, channelName: 'Not found', subscriberCount: '0', description: 'N/A', subscribed: false,
      videos: []
    }
  );
  const imgurl = "https://plus.unsplash.com/premium_photo-1778339919635-3b97fde50ed5?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  useEffect(() => {
    (async () => {
      setIsLoading(true)
      if (user.userId)
        await channelDetails({
          channelId: query
        }, setChannel)
      setIsLoading(false)
    })()
  }, [user]);
  return (
    <div className="space-y-6">

      {/* Identity Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 [from-blue-600 to-indigo-900]">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{channel.channelName}</h1>
          <p className="text-sm font-semibold text-zinc-400">{channel.subscriberCount || 0} subscribers</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl pt-2 leading-relaxed">{channel.description}</p>
        </div>

        <button
          onClick={async () => {
            let d = false
            if (!channel.subscribed) d = await subscribeChannel(query)
            if (channel.subscribed) d = await unsubscribeChannel(query)
            setChannel(state => ({
              ...state,
              subscribed: d,
              subscriberCount: d ? (+channel.subscriberCount + 1) : (+channel.subscriberCount - 1)
            }))
          }}
          className={`px-6 py-2.5 rounded-full cursor-pointer font-bold text-sm transition-all self-start md:self-center ${channel.subscribed ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20  hover:bg-blue-700'
            }`}
        >
          {channel.subscribed ? 'Subscribed' : 'Subscribe'}
        </button>
      </div>

      {/* Videos Layout Grid */}
      <div className="space-y-4">
        <h3 className="font-bold tracking-wide uppercase text-zinc-400 text-xs">Uploaded videos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channel.videos[0] ? (channel.videos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => navigate(`/watch/${vid.id}`)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden mb-3 border border-zinc-300/10">
                <img
                  src={vid?.thumbnailUrl || imgurl} // Fallback to your default imgurl if vid doesn't have one
                  alt={vid.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                {vid.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">{vid.viewCount} views • {vid.likesCount} likes • {(new Date(vid.createdAt)).toDateString()}</p>
            </div>
          ))) : (
            <div className=' text-lg'>No videos available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelProfile;