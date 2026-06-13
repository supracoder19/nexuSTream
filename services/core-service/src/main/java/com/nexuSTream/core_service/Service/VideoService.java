package com.nexuSTream.core_service.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.nexuSTream.core_service.DTO.CommentProjection;
import com.nexuSTream.core_service.DTO.Event;
import com.nexuSTream.core_service.DTO.QueueMessage;
// import com.nexuSTream.core_service.DTO.Event;
import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.DTO.UnifiedNotificationEvent;
import com.nexuSTream.core_service.DTO.VideoListProjection;
import com.nexuSTream.core_service.DTO.VideoUploadReq;
import com.nexuSTream.core_service.DTO.VideoWatchResponse;
import com.nexuSTream.core_service.Models.Channel;
import com.nexuSTream.core_service.Models.Comment;
import com.nexuSTream.core_service.Models.CustomUniqueId;
import com.nexuSTream.core_service.Models.Notification;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Models.Video;
import com.nexuSTream.core_service.Models.VideoLike;
import com.nexuSTream.core_service.Repository.CommentsRepo;
import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
// import com.nexuSTream.core_service.Repository.ChannelRepo;
import com.nexuSTream.core_service.Repository.UserRepo;
import com.nexuSTream.core_service.Repository.VideoLikeRepo;
import com.nexuSTream.core_service.Repository.VideoRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoService {
    private final S3Service s3;
    private final RedisService red;
    private final VideoRepo vRepo;
    private final UserRepo uRepo;
    private final NotificationRepo nrepo;
    private final CommentsRepo cRepo;
    private final SubRepo subRepo;
    private final AuthService aserve;
    private final VideoLikeRepo likeRepo;
    @Value("${S3_BASE_URL}")
    private String BaseUrl ;

    @Value("${topic.video.uploaded}")
    private String videoUploadedTopic;

    @Value("${topic.notification}")
    private String notificationTopic;

    public ResponseObject<?> videoUpload(VideoUploadReq req) {
        ResponseObject<Map<String, String>> res = new ResponseObject<>();
        try {
            String username = aserve.getUserName();
            User u = uRepo.findByUsername(username).orElseThrow(() -> new Exception("User name Not Found"));
            Channel channel = u.getChannel();
            if (channel == null)
                throw new Exception("No channel found");
            Video video = new Video();
            video.setChannel(channel);
            video.setTitle(req.getTitle());
            video.setDescription(req.getDescription());
            video.setPrivate(false);
            vRepo.save(video);
            String thumbnailString = BaseUrl + video.getId() + "/thumbnail/" + video.getId() + "."
                    + req.getThumbnailType();
            video.setThumbnailUrl(thumbnailString);
            vRepo.save(video);
            String videoPath = video.getId() + "/video/" + video.getId() + "." + req.getVideoType();
            String thumbnailPath = video.getId() + "/thumbnail/" + video.getId() + "." + req.getThumbnailType();
            System.out.println(req.getThumbnailSize() + " " + req.getVideoSize());
            String getVideoUrl = s3.generateUploadUrl(videoPath, req.getVideoSize());
            String getThumbnailUrl = s3.generateUploadUrl(thumbnailPath, req.getThumbnailSize());
            Map<String, String> data = new HashMap<>();
            data.put("videoUploadUrl", getVideoUrl);
            data.put("thumbnailUploadUrl", getThumbnailUrl);
            data.put("videoKey", videoPath);
            data.put("videoId", String.valueOf(video.getId()));
            res.setData(List.of(data));
            return res;
        } catch (Exception e) {
            // e.printStackTrace();
            res.setSuccess(false);
            res.setMsg(e.getMessage());
            return res;
        }
    }

    public ResponseObject<String> signalForFinshUpload(Map<String, String> req) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            String key = req.get("videoId");
            String value = req.get("videoKey");
            Video video = vRepo.findById(Long.valueOf(key)).orElse(null);
            if (video != null && !video.isProcessed()) {
                Event<String> event = new Event<>(key, value);
                QueueMessage<String> newMsg=new QueueMessage<>(videoUploadedTopic,event);
                red.pushTask(newMsg);
                res.setMsg("video processing started");
            } else {
                throw new Exception("Either video uploaded or not found");
            }
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<?> videoWatch(String videoId) {
        ResponseObject<VideoWatchResponse> res = new ResponseObject<>();
        try {
            Video video = vRepo.findById(Long.valueOf(videoId)).orElseThrow(() -> new Exception("No video found"));
            video.setViewCount(video.getViewCount()+1);
            List<CommentProjection> comments = cRepo.findByVideo(video);
            User u = uRepo.findByUsername(aserve.getUserName()).orElseThrow(() -> new Exception("user not found"));
            boolean isLiked = likeRepo.existsById(new CustomUniqueId(u.getId(), video.getId()));
            boolean isSubscribed = subRepo.customExistsBy(video.getChannel(),u);
            VideoWatchResponse vres = new VideoWatchResponse(video.getVideoUrl(), video.getTitle(),
                    video.getThumbnailUrl(), isLiked, isSubscribed, video.getChannel().getId(), video.getId(),
                    comments,video.getChannel().getChannelName());
            res.setMsg("Enjoy streaming");
            res.setData(List.of(vres));
            vRepo.save(video);
        } catch (Exception e) {
            res.setMsg(e.getMessage());
            res.setData(null);
        }
        return res;
    }

    public ResponseObject<?> videoLike(String videoId) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            User u = uRepo.findByUsername(aserve.getUserName())
                    .orElseThrow(() -> new Exception("User not authenticated"));
            VideoLike like = likeRepo.findById(new CustomUniqueId(u.getId(), Long.valueOf(videoId))).orElse(null);
            Video video = vRepo.findById(Long.valueOf(videoId)).orElseThrow(() -> new Exception("Video not found"));
            if (like != null)
                throw new Exception("already liked");
            like = new VideoLike();
            like.setUser(u);
            like.setVideo(video);
            like.setId(new CustomUniqueId(u.getId(), Long.valueOf(videoId)));
            likeRepo.save(like);
            Notification n=new Notification();
            n.setType("VIDEO_LIKED");
            n.setContent("Your video "+video.getTitle()+" was liked by "+u.getUsername()+"!");
            n.setRecipient(video.getChannel().getOwner());
            n.setVideoId(video.getId());
            nrepo.save(n);
            res.setMsg("Video Liked");
            Map<String,Object> mp = new HashMap<>();
            mp.put("ownerId",video.getChannel().getOwner().getId());
            mp.put("videoTitle",video.getTitle());
            UnifiedNotificationEvent notice =  new UnifiedNotificationEvent("video liked",u.getId(),u.getUsername(),null,mp);
            QueueMessage<UnifiedNotificationEvent> newMsg=new QueueMessage<>(notificationTopic,new Event<UnifiedNotificationEvent>("video liked",notice));
            red.pushTask(newMsg);
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<?> videoDislike(String videoId) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            User u = uRepo.findByUsername(aserve.getUserName())
                    .orElseThrow(() -> new Exception("User not authenticated"));
            VideoLike like = likeRepo.findById(new CustomUniqueId(u.getId(), Long.valueOf(videoId)))
                    .orElseThrow(() -> new Exception("already not liked"));
            likeRepo.delete(like);
            res.setMsg("Video disliked");
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<?> seeVideosOwner() {
        ResponseObject<List<VideoListProjection>> res = new ResponseObject<>();
        try {
            User u = uRepo.findByUsername(aserve.getUserName()).orElseThrow(() -> new Exception("Unauthorized"));
            Long channelId = u.getChannel().getId();
            List<VideoListProjection> v1 = vRepo.fetchCustomVideoListOwner(channelId);
            res.setMsg("Successfully fetched videos");
            res.setData(List.of(v1));
        } catch (Exception e) {
            res.setMsg(e.getMessage());
            res.setSuccess(false);
        }

        return res;
    }

    public ResponseObject<Map<String, Object>> seeVideosHomepage(int page, int size) {
    ResponseObject<Map<String, Object>> res = new ResponseObject<>();
    try {
        // 1. Create a Pageable instance (sorting newest videos first)
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 2. Fetch the discrete, paged data block from the repository
        Page<VideoListProjection> videoPage = vRepo.fetchDiscoverableVideosPaged(pageable);
        
        // 3. Construct a clean Object Map. Spring converts this straight to readable JSON!
        Map<String, Object> mp = new HashMap<>();
        
        // Use videoPage fields instead of making an extra database count query
        mp.put("totalVideo", videoPage.getTotalElements()); 
        mp.put("totalPages", videoPage.getTotalPages());
        mp.put("videos", videoPage.getContent()); // Extracts just the current page slice array

        // 4. Build your custom response object envelope
        res.setMsg("Successfully fetched homepage videos");
        res.setSuccess(true);
        res.setData(List.of(mp)); 

    } catch (Exception e) {
        res.setMsg(e.getMessage());
        res.setSuccess(false);
    }

    return res;
}



    public ResponseObject<String> deleteVideo(Long videoId) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            // 1. Authenticate user and verify channel ownership
            User u = uRepo.findByUsername(aserve.getUserName())
                    .orElseThrow(() -> new Exception("Unauthorized"));

            Video video = vRepo.findById(videoId)
                    .orElseThrow(() -> new Exception("Video not found"));

            if (u.getChannel() == null || !video.getChannel().getId().equals(u.getChannel().getId())) {
                throw new Exception("You do not have permission to delete this video");
            }

            s3.deleteKeyWithException(String.valueOf(videoId));
            vRepo.delete(video);

            res.setMsg("Video deleted successfully");
            res.setSuccess(true);
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<String> makePrivate(Long videoId) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            User u = uRepo.findByUsername(aserve.getUserName())
                    .orElseThrow(() -> new Exception("Unauthorized"));

            Video video = vRepo.findById(videoId)
                    .orElseThrow(() -> new Exception("Video not found"));

            if (u.getChannel() == null || !video.getChannel().getId().equals(u.getChannel().getId())) {
                throw new Exception("You do not have permission to modify this video");
            }

            if (video.isPrivate()) {
                throw new Exception("Video is already private");
            }

            video.setPrivate(true);
            vRepo.save(video);

            res.setMsg("Video visibility updated to Private");
            res.setSuccess(true);
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<String> makePublic(Long videoId) {
        ResponseObject<String> res = new ResponseObject<>();
        try {
            User u = uRepo.findByUsername(aserve.getUserName())
                    .orElseThrow(() -> new Exception("Unauthorized"));

            Video video = vRepo.findById(videoId)
                    .orElseThrow(() -> new Exception("Video not found"));

            if (u.getChannel() == null || !video.getChannel().getId().equals(u.getChannel().getId())) {
                throw new Exception("You do not have permission to modify this video");
            }

            if (!video.isPrivate()) {
                throw new Exception("Video is already public");
            }

            video.setPrivate(false);
            vRepo.save(video);

            res.setMsg("Video visibility updated to Public");
            res.setSuccess(true);
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<?> commentOnVideo(Long videoId,String content)
    {
        ResponseObject<String> res= new ResponseObject<>();
        try {
            Video video= vRepo.findById(videoId).orElseThrow(()->new Exception("Video nor availaible"));
            User user= uRepo.findByUsername(aserve.getUserName()).orElseThrow(()->new Exception("Unauthorized"));
            Comment comment= new Comment();
            comment.setContent(content);
            comment.setVideo(video);
            comment.setUser(user);
            cRepo.save(comment);
            res.setMsg("Comment saved");
            Notification n=new Notification();
            n.setType("commented");
            n.setContent(user.getUsername()+" commented on your video "+video.getTitle()+"!");
            n.setRecipient(video.getChannel().getOwner());
            n.setVideoId(video.getId());
            nrepo.save(n);
            Map<String,Object> mp = new HashMap<>();
            mp.put("ownerId",video.getChannel().getOwner().getId());
            mp.put("videoTitle",video.getTitle());
            UnifiedNotificationEvent notice =  new UnifiedNotificationEvent("commented",user.getId(),user.getUsername(),null,mp);
            QueueMessage<UnifiedNotificationEvent> newMsg=new QueueMessage<>(notificationTopic,new Event<UnifiedNotificationEvent>("video commented",notice));
            red.pushTask(newMsg);
        } catch (Exception e) {
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }
}
