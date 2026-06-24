import axios from "axios"
import { toast } from "react-toastify"
const gateway_api = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8081/apiV2/"
const core_api = import.meta.env.VITE_CORE_URL || "http://localhost:8081/apiV1/"
const Upload = async (user, video, thumbnail, title, description, setActiveTab) => {
  let toastId
  let videoKey, videoId, thumbnailKey
  try { 
    let v = ""
    let res = await axios.post(core_api + "video/upload", {
      userId: user.userId,
      videoType: video?.type?.slice(6),
      thumbnailType: thumbnail?.type?.slice(6),
      title,
      description,
      videoSize: video.size,
      thumbnailSize: thumbnail.size
    },
      {
        withCredentials: true
      })
    if (res.data.success) {
      videoKey = res.data.data[0].videoKey
      videoId = res.data.data[0].videoId
      thumbnailKey = res.data.data[0].thumbnailKey
      const videoUrl = res.data.data[0].videoUploadUrl
      const thumbanilUrl = res.data.data[0].thumbnailUploadUrl
      if (!videoUrl || !thumbanilUrl) throw new Error("No upload url found")
      toastId = toast.loading("Starting video upload...");
      res = await axios.put(videoUrl, video, {
        headers: {
          // Match the Content-Type to the file type (e.g., 'video/mp4' or 'image/jpeg')
          'Content-Type': video.type,
        },
        // Optional: Add a progress tracker if you're uploading large videos
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Video Upload progress: ${percentCompleted}%`);
          toast.update(toastId, {
            render: `Uploading video: ${percentCompleted}%`,
            type: "default", // or "info"
            isLoading: true,
            progress: percentCompleted / 100, // React-toastify expects a value between 0 and 1
          });
        }
      });
      toast.update(toastId, {
    render: "Video uploaded successfully!",
    type: "success",
    isLoading: false,
    autoClose: 3000, // Closes after 3 seconds
  });
  toastId = toast.loading("Starting thumbnail upload...");
      if (!res.status == 200) throw new Error("Could not upload video")
      res = await axios.put(thumbanilUrl, thumbnail, {
        headers: {
          // Match the Content-Type to the file type (e.g., 'video/mp4' or 'image/jpeg')
          'Content-Type': thumbnail.type,
        },
        // Optional: Add a progress tracker if you're uploading large videos
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Thumbnail Upload progress: ${percentCompleted}%`);
          toast.update(toastId, {
            render: `Uploading thumbnail: ${percentCompleted}%`,
            type: "default", // or "info"
            isLoading: true,
            progress: percentCompleted / 100, // React-toastify expects a value between 0 and 1
          });
        }
      });
      toast.update(toastId, {
    render: "Thumbnail uploaded successfully!",
    type: "success",
    isLoading: false,
    autoClose: 3000, // Closes after 3 seconds
  });
      if (!res.status == 200) throw new Error("Could not upload Thumbnail")
      console.log("Video Uploaded Succesfully")
      res = await axios.post(core_api + "video/uploaded", {
        videoId,
        videoKey,
        thumbnailKey,
      },
        {
          withCredentials: true
        })
      if (res.data.success) {
        setActiveTab("manage")
      }
      else throw new Error(res.data.message)
    }
    else throw new Error(res.data.msg)
  }
  catch (e) {
    console.log(e)
    if(videoId!=null) deleteVideo(videoId)
    toast.update(toastId, {
    render: e.message,
    type: "error",
    isLoading: false,
    autoClose: 3000, // Closes after 3 seconds
  });

  }

}

const videoWatch = async (videoId) => {
  try {
    const res = await axios.get(`${core_api}video/watch/${videoId}`, {
      withCredentials: true // Included to match your upload configuration for session/auth
    });

    if (res.data.success) {
      // Assuming the backend returns the video details or a playback URL
      return res.data.data[0];
      
    } else {
      throw new Error(res.data.msg || "Failed to fetch video data");
    }
  } catch (e) {
    console.error("Error fetching video:", e);
  }
};

const videoLike = async (videoId, setLiked) => {
  try {
    const res = await axios.get(`${core_api}video/like/${videoId}`, {
      withCredentials: true // Included to match your upload configuration for session/auth
    });

    if (res.data.success) {
      // Assuming the backend returns the video details or a playback URL
      setLiked(true)
    } else {
      throw new Error(res.data.msg || "Failed to fetch video data");
    }
  } catch (e) {
    console.error("Error fetching video:", e);
  }
};
const videoDislike = async (videoId, setLiked) => {
  try {
    const res = await axios.get(`${core_api}video/dislike/${videoId}`, {
      withCredentials: true // Included to match your upload configuration for session/auth
    });

    if (res.data.success) {
      // Assuming the backend returns the video details or a playback URL
      setLiked(false)
    } else {
      throw new Error(res.data.msg || "Failed to fetch video data");
    }
  } catch (e) {
    console.error("Error fetching video:", e);
  }
};

const seeOwnerVideos = async (setVideos) => {
  try {
    const res = await axios.get(`${core_api}video/owner/seeVideos`, {
      withCredentials: true
    })
    if (res.data.success) {
      setVideos(res.data.data[0])
      // console.log(res.data.data[0]);

    }
    else throw new Error(res.data.msg)
  } catch (error) {
    console.log(error);

  }
}

const deleteVideo = async (videoId) => {
  try {
    const res = await axios.get(`${core_api}video/owner/deleteVideo/${videoId}`, {
      withCredentials: true
    })
    if (res.data.success) {
      return true
    }
    else throw new Error(res.data.msg)
  } catch (error) {
    console.log(error);
  }
  return false
}
const makePublic = async (videoId) => {
  try {
    const res = await axios.get(`${core_api}video/owner/makePublic/${videoId}`, {
      withCredentials: true
    })
    if (res.data.success) {
      return true
    }
    else throw new Error(res.data.msg)
  } catch (error) {
    console.log(error);
  }
  return false
}
const makePrivate = async (videoId) => {
  try {
    const res = await axios.get(`${core_api}video/owner/makePrivate/${videoId}`, {
      withCredentials: true
    })
    if (res.data.success) {
      return true
    }
    else throw new Error(res.data.msg)
  } catch (error) {
    console.log(error);
  }
  return false
}

const fetchVideosByPage = async (page, size) => {
  try {
    // 1. Fetch data from your Spring Boot Endpoint
    const res = await axios.post(`${core_api}video/seeHomeVideos`, {
      page, size
    }, {
      withCredentials: true
    });
    if (res.data.success) {
      return res.data.data[0]
    }
    else throw new Error(res.data.msg)
  } catch (error) {
    console.error(error)
  }
  return null
};

const addComment = async (videoId, content) => {
  try {
    const res = await axios.post(`${core_api}video/comment`, {
      videoId, content
    },
      { withCredentials: true })
    if (res.data.success) return true
    else throw new Error(res.data.msg)
  } catch (error) {
    console.log(error);
  }
  return false;
}
export { Upload, videoWatch, videoLike, videoDislike, seeOwnerVideos, deleteVideo, makePublic, makePrivate, fetchVideosByPage, addComment }