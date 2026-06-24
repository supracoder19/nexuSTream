import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { deleteVideo, makePrivate, makePublic, seeOwnerVideos, Upload } from '../Services/VideoService';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../Services/AuthService';
import { toast } from 'react-toastify';

const Dashboard = ({setIsLoading}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile');
  // Profile States
  const [username, setUsername] = useState('NexusCreator');
  const [email, setEmail] = useState('creator@nexustream.com');
  const [bio, setBio] = useState('Streaming the future of tech, daily.');
  const [currentPassword, setCurrentPassword] = useState('');
  const [channelName, setChannelName] = useState("");
  const [newPassword, setNewPassword] = useState('');
  const [thumbNail, setThumbNail] = useState({
    name:""
  });
  const [videos, setVideos] = useState([]);

  const [video, setVideo] = useState({});
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");

  // // Dummy State for content management demonstration
  // const [pastVideos, setPastVideos] = useState([
  //   { id: 1, title: 'Vite v4 Breakdown', views: '25K', date: '2026-05-10', type: 'Recorded' },
  //   { id: 2, title: 'Build a Streaming Hub From Scratch', views: '110K', date: '2026-04-18', type: 'Live' },
  // ]);

  const user = useSelector(state => state.user)
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    await updateUser({ username, email, bio, currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setIsLoading(false)
    // alert("Profile settings updated successfully!");
  };
  useEffect(() => {
    if(user)
    {
    setUsername(user.userName||"")
    setEmail(user.email||"")
    setBio(user.channelDesc||"dummy chnanel")
    setChannelName(user.channelName||"dummy")
    }
  }, [user]);

  useEffect(() => {
    setVideo({})
    setThumbNail({})
    setVideoTitle("")
    setVideoDesc("")
    if(activeTab==="manage")
    {
      (async ()=>{setIsLoading(true)
      await seeOwnerVideos(setVideos)
    setIsLoading(false)})()
    }
  }, [activeTab]);
  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-120px)]">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-4 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-xl font-bold text-white mb-2">
            {username?username[0].toUpperCase():"NC"}
          </div>
          <h2 className="font-bold">{username}</h2>
          <p className="text-xs text-zinc-500">Creator Studio</p>
        </div>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full cursor-pointer text-left p-3 rounded-xl font-medium transition ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
        >
          👤 Edit Profile & Account
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`w-full cursor-pointer text-left p-3 rounded-xl font-medium transition ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
        >
          📁 Upload Video
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`w-full cursor-pointer text-left p-3 rounded-xl font-medium transition ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
        >
          🎬 Manage Content
        </button>
        {/* <button 
          onClick={() => setActiveTab('live')}
          className={`w-full text-left p-3 rounded-xl font-medium transition ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
        >
          📡 Stream Setup
        </button> */}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        
        {/* Tab 1: Profile & Account Settings (UPDATED) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Profile & Account Settings</h3>
              <p className="text-sm text-zinc-500">Update your public channel look and account credentials securely.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {/* Public Customization Left Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-blue-500 uppercase tracking-wider">Public Channel Info</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Channel Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none" 
                    value={channelName} 
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Channel Bio</label>
                  <textarea 
                    rows="4"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none resize-none" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              {/* Secure Credentials Right Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">Security & Access</h4>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep unchanged"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 ring-blue-500 outline-none" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
                Save Global Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Upload Video File Form */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Video Stream for Future</h3>
              <p className="text-sm text-zinc-500">Publish high-definition recorded formats to your feeds.</p>
            </div>
            <div className=' grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer ">
              <span className="text-4xl block mb-2">📤</span>
            <input type="file" accept="image/*" required
            onChange={(e) => {
              const file=e.target.files[0]
              if(!file.type.startsWith("image/"))
                toast.error("Select an image!!");
              else setThumbNail(e.target.files[0])}}
             className=' hidden' />
              <p className="font-bold">{thumbNail?.name?thumbNail.name:"Drag and drop files here"}</p>
              <p className="text-xs text-zinc-400 mt-1">{thumbNail?.name?`${((thumbNail.size/1024)/1024).toFixed(2)}mb`:"any image"}</p>
            </label>
            <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer  ">
              <span className="text-4xl block mb-2">📤</span>
              <p className="font-bold">{video?.name?video.name:"Drag and drop files here"}</p>
              <p className="text-xs text-zinc-400 mt-1">{video?.name?`${((video.size/1024)/1024).toFixed(2)}mb`:"any video under 100mb"}</p>
              <input type="file" accept="video/*" required
              onChange={(e) => {
                const file = e.target.files[0]
                if(file.size>(100*1024*1024))
                  toast.error("file must be under 100mb")
                else if(!file.type.startsWith("video/"))
                {
                  toast.error("Select a video!!")
                }
                else
                {
                  setVideo(file)
                }
              }}
             className=' hidden' />
            </label>
            </div>
            <div className="space-y-4">
              <input value={videoTitle} onChange={(e)=>setVideoTitle(e.target.value)} type="text" placeholder="Video Title" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" />
              <textarea value={videoDesc} onChange={(e)=>setVideoDesc(e.target.value)} placeholder="Video Description" rows="3" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" />
              <button onClick={async ()=>{
                 if(video.name=='' && thumbNail.name=='')
                  toast.error("Select files");
                if(videoDesc=='' && videoTitle=='')
                  toast.error("Write the contents");
                else
                { setIsLoading(true)
                  await Upload(user,video,thumbNail,videoTitle,videoDesc,setActiveTab)
                setIsLoading(false)
                }
              }} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Publish Video</button>
            </div>
          </div>
        )}

        {/* Tab 3: Manage Content Tables */}
{/* Tab 3: Manage Content Tables */}
{activeTab === 'manage' && (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-bold text-zinc-100">Your Uploaded Library</h3>
      <p className="text-sm text-zinc-500">Monitor engagement metrics, toggle privacy, or remove past recordings.</p>
    </div>

    {/* Main Container */}
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
      
      {/* 1. DESKTOP Table Header Row (Hidden on Mobile) */}
      <div className="hidden md:grid grid-cols-12 gap-4 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm font-semibold p-4 bg-zinc-900">
        <div className="col-span-3">Title</div>
        <div className="col-span-3">Status</div>
        <div className="col-span-2">Metrics</div>
        <div className="col-span-2">Uploaded</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table / Card Body Rows */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
        {videos && videos.length > 0 ? (
          videos.map((item) => (
            <div key={item.id}>
              
              {/* 2. DESKTOP ROW VIEW (md and up) */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                {/* Title */}
                <div className="col-span-3 font-medium text-zinc-200 truncate pr-2">
                  {item.title}
                </div>
                
                {/* Status */}
                <div className="col-span-3 flex flex-wrap gap-2 items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                    item.private 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {item.private ? 'Private' : 'Public'}
                  </span>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                    item.processed === "TRUE"
                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                      : item.processed === "FAILED"
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                  }`}>
                    {item.processed === "TRUE" ? 'Processed' : item.processed === "FAILED" ? 'Failed' : 'Processing'}
                  </span>
                </div>
                
                {/* Metrics */}
                <div className="col-span-2 flex flex-col text-zinc-400">
                  <span className="text-zinc-300 font-medium">{item.viewCount || 0} views</span>
                  <span className="text-xs text-zinc-500">{item.likesCount || 0} likes</span>
                </div>
                
                {/* Uploaded Date */}
                <div className="col-span-2 text-zinc-400 truncate">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
                
                {/* Actions */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-3 text-center">
                    {item.processed === "FAILED" ? (
                      <button 
                        onClick={async () => {
                          setIsLoading(true);
                          // Replace with your actual retry service method
                          // await retryVideoProcessing(item.id); 
                          // Optionally re-fetch owner videos to refresh status
                          await seeOwnerVideos(setVideos);
                          setIsLoading(false);
                        }}
                        className="text-blue-500 hover:text-blue-400 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        🔄 Retry
                      </button>
                    ) : (
                      <button 
                        onClick={async () => { 
                          const d = item.private ? await makePublic(item.id) : await makePrivate(item.id);
                          if(d) {
                            setVideos(state => state.map((thisItem) => 
                              thisItem.id === item.id ? { ...thisItem, private: !thisItem.private } : thisItem
                            ));
                          }
                        }}
                        className="text-zinc-400 hover:text-zinc-200 font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {item.private ? 'Make Public' : 'Make Private'}
                      </button>
                    )}
                    
                    {/* Allow deleting both processed and failed videos */}
                    {(item.processed === "TRUE" || item.processed === "FAILED") && (
                      <>
                        <div className="h-3 w-[1px] bg-zinc-700 shrink-0" />
                        <button 
                          onClick={async () => {
                            const d = await deleteVideo(item.id);
                            if(d) setVideos(state => state.filter((thisItem) => thisItem.id !== item.id));
                          }}
                          className="text-red-500 cursor-pointer hover:text-red-400 font-medium text-xs transition-colors shrink-0"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. MOBILE CARD VIEW (Block view beneath 768px viewports) */}
              <div className="block md:hidden p-4 space-y-3 hover:bg-zinc-800/10 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold text-zinc-200 line-clamp-2 max-w-[70%]">
                    {item.title}
                  </div>
                  <div className="text-right text-xs text-zinc-500 shrink-0">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Badges */}
                  <div className="flex gap-1.5 items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.private 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {item.private ? 'Private' : 'Public'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.processed === "TRUE" 
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                        : item.processed === "FAILED"
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>
                      {item.processed === "TRUE" ? 'Processed' : item.processed === "FAILED" ? 'Failed' : 'Processing'}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="text-xs text-zinc-400 space-x-2">
                    <span className="text-zinc-300 font-medium">{item.viewCount || 0} views</span>
                    <span className="text-zinc-600 dark:text-zinc-700">•</span>
                    <span className="text-zinc-500">{item.likesCount || 0} likes</span>
                  </div>
                </div>

                {/* Mobile Action Triggers */}
                <div className="flex gap-3 pt-2 justify-end border-t border-zinc-100/10 dark:border-zinc-800/50">
                  {item.processed === "FAILED" ? (
                    <button 
                      onClick={async () => {
                        setIsLoading(true);
                        // await retryVideoProcessing(item.id);
                        await seeOwnerVideos(setVideos);
                        setIsLoading(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      🔄 Retry
                    </button>
                  ) : (
                    <button 
                      onClick={async () => { 
                        const d = item.private ? await makePublic(item.id) : await makePrivate(item.id);
                        if(d) {
                          setVideos(state => state.map((thisItem) => 
                            thisItem.id === item.id ? { ...thisItem, private: !thisItem.private } : thisItem
                          ));
                        }
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer"
                    >
                      {item.private ? 'Make Public' : 'Make Private'}
                    </button>
                  )}
                  
                  {(item.processed === "TRUE" || item.processed === "FAILED") && (
                    <button 
                      onClick={async () => {
                        const d = await deleteVideo(item.id);
                        if(d) setVideos(state => state.filter((thisItem) => thisItem.id !== item.id));
                      }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-500 italic">
            No videos found.
          </div>
        )}
      </div>
    </div>
  </div>
)}
        

      </div>
    </div>
  );
};

export default Dashboard;