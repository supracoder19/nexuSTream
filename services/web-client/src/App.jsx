import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Home from './Pages/Home';
import VideoPlayer from './Pages/VideoPlayer';
import Login from './Pages/Login';
import Intro from './Pages/Intro';
import Register from './Pages/Register';
import { refresh } from './Services/AuthService';
import Dashboard from './Pages/Dashboard';
import SearchResults from './Pages/SearchResults';
import ChannelProfile from './Pages/ChannelProfile';
import NotificationPage from './Pages/NotificationPage';
import Loader from './Components/Loader';
import axios from 'axios';
const core_api = import.meta.env.VITE_CORE_URL || "http://localhost:8081/apiV1/"
const fetchActiveUser=async ()=>{
  try {
    const res=await axios.get(core_api+"auth/viewCount")
    if(isNaN(Number(res.data))) return 0;
    return Number(res.data)
  } catch (error) {
    console.log(error);
    return 0
  }
}
function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
  }, [isDarkMode]);
  useEffect(() => {
    (async ()=>{
      let num=await fetchActiveUser()
      setViewerCount(num)
    })()
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <>
    {isLoading && <Loader/>}
    <ToastContainer/>
   <Router basename="/">
      <Routes>
        {/* Login route placed outside the main Layout */}
        <Route path="/" element={<Intro viewerCount={viewerCount} />} />
        <Route path="/login" element={<Login setIsLoading={setIsLoading} />} />
        <Route path="/register" element={<Register setIsLoading={setIsLoading} />} />
        
        {/* App routes wrapped inside the Layout */}
        <Route element={<Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}>
                <Route path="/home" element={<Home setIsLoading={setIsLoading} />} />
                <Route path="/search/:query" element={<SearchResults setIsLoading={setIsLoading} />} />
                <Route path="/channel/:query" element={<ChannelProfile setIsLoading={setIsLoading} />} />
                <Route path="/watch/:videoId" element={<VideoPlayer setIsLoading={setIsLoading} />} />
                <Route path="/dashboard" element={<Dashboard setIsLoading={setIsLoading} />} />
                <Route path="/notifications" element={<NotificationPage setIsLoading={setIsLoading}/>}/>
        </Route>
      </Routes>
    </Router>
    </>
  );
}

export default App;