
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import Vidstack components + Gesture engine
import { MediaPlayer, MediaProvider, Poster, Gesture } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Core package styles direct routing (Verified from your file directory tree)
// import 'vidstack/bundle';
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// Data services
import { addComment, videoDislike, videoLike, videoWatch } from '../Services/VideoService';
import { subscribeChannel, unsubscribeChannel } from '../Services/ChannelService';

const VPlayer = ({ setIsLoading }) => {
  const { videoId } = useParams();
  
  const [liked, setLiked] = useState(false);
  const [subbed, setSubbed] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [channelNAme, setChannelNAme] = useState("");
  const user = useSelector(state => state.user);
  const navigate = useNavigate();
  
  const [videoSrc, setVideoSrc] = useState("");
  const [thumbnailSrc, setThumbnailSrc] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [title, setTitle] = useState("");

  // 1. Fetch Video Metadata
  useEffect(() => {
    (async () => {
      if (videoId) {
        setIsLoading(true);
        const data = await videoWatch(videoId);
        if (data) {
          setVideoSrc(data.videoUrl || "");
          setThumbnailSrc(data.thumbnailUrl || ""); 
          setComments(data.comments || []);
          setLiked(data.liked);
          setSubbed(data.subscribed);
          setTitle(data.title || "New video");
          setChannelId(data.channelId);
          setChannelNAme(data.channelName);
        }
        setIsLoading(false);
      }
    })();
  }, [videoId, setIsLoading]);

  // 2. Add New Comment Action
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const freshComment = {
      id: Date.now(),
      author: user.userName,
      content: newComment,
      createdAt: new Date().toLocaleString()
    };
    const d = addComment(videoId, newComment);
    if (d) {
      setComments([freshComment, ...comments]);
      setNewComment('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 max-w-[1600px] mx-auto text-zinc-900 dark:text-zinc-100">
      
      {/* COLUMN 1 & 2: Video Workspace */}
      <div className="lg:col-span-2 flex flex-col">
        
        <div className="w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative select-none">
          {videoSrc ? (
            <MediaPlayer 
              title={title} 
              src={videoSrc}
              aspectRatio="16/9"
              playsInline
              // fullscreenOrientation="none" /* Silences console error on desktop windows */
              className="w-full h-full object-contain relative"
            >
              {/* --- GESTURE HIT DETECTION LAYER --- */}
              {/* Single tap: toggles playback across desktop mouse and mobile screens */}
              <Gesture 
                action="toggle:paused" 
                event="pointerup" 
                className="absolute inset-0 z-10 block cursor-pointer" 
              />
              
              {/* Overrides pause capture on double clicks so skips process instantly */}
              <Gesture 
                action="toggle:paused" 
                event="dblpointerup" 
                className="absolute inset-0 z-0 hidden" 
              />

              {/* Double tap left: seek backwards 10s */}
              <Gesture 
                action="seek:-10" 
                event="dblpointerup" 
                className="absolute top-0 left-0 w-1/3 h-full z-20 block touch-none" 
              />
              
              {/* Double tap right: seek forwards 10s */}
              <Gesture 
                action="seek:10" 
                event="dblpointerup" 
                className="absolute top-0 right-0 w-1/3 h-full z-20 block touch-none" 
              />

              {/* Media pipeline layout content provider */}
              <MediaProvider>
                {thumbnailSrc && (
                  <Poster 
                    className="vds-poster object-contain"
                    src={thumbnailSrc} 
                    alt={title} 
                  />
                )}
              </MediaProvider>
              
              {/* Renders native control bars, settings cogwheel, and tracking overlay */}
              <DefaultVideoLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
          ) : (
            <div className="aspect-video w-full bg-zinc-900 animate-pulse flex items-center justify-center">
              <span className="text-sm text-zinc-500">Loading Stream Engine...</span>
            </div>
          )}
        </div>

        {/* Video Information Metadata Blocks */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex flex-wrap items-center justify-between mt-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full" />
              <span className='font-bold text-lg cursor-pointer' onClick={() => { navigate("/channel/" + channelId) }}>{channelNAme}</span>
              <button 
                onClick={async () => {
                  let d = subbed ? (await unsubscribeChannel(channelId)) : (await subscribeChannel(channelId));
                  setSubbed(d);
                }}
                className={`px-6 py-2 rounded-full font-bold cursor-pointer transition-all ${
                  subbed ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                }`}
              >
                {subbed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            <button 
              onClick={() => {
                if (liked) videoDislike(videoId, setLiked);
                else videoLike(videoId, setLiked);
              }}
              className={`flex items-center cursor-pointer gap-2 px-6 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition ${
                liked ? 'text-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''
              }`}
            >
              👍 {liked ? 'Liked' : 'Like'}
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Social Interactions (Comments) */}
      <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-6 lg:pt-0 lg:pl-6 h-fit">
        <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>
        <form onSubmit={handleAddComment} className="flex gap-4 mb-6">
          <div className="w-10 h-10 bg-zinc-300 dark:bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {user.userName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Add a public comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 py-2 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm"
            />
          </div>
        </form>

        <div className="space-y-6 max-h-[500px] lg:max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start text-sm">
              <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold shrink-0">
                {comment.author ? comment.author[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold truncate">{comment.author}</span>
                  <span className="text-xs text-zinc-500 shrink-0">{(new Date(comment.createdAt)).toLocaleString()}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default VPlayer;