package com.nexuSTream.core_service.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.DTO.VideoUploadReq;
import com.nexuSTream.core_service.Service.VideoService;

import lombok.RequiredArgsConstructor;

import java.util.Map;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;




@RestController
@RequestMapping("/video")
@RequiredArgsConstructor
public class VideoController {
    public final VideoService vserve;
    @PostMapping("/upload")
    public ResponseEntity<?> videoUpload(@RequestBody VideoUploadReq req) {
        ResponseObject<?> res= vserve.videoUpload(req);
        return ResponseEntity.ok(res);
    }
    @PostMapping("/uploaded")
    public ResponseEntity<?> signalForprocessing(@RequestBody Map<String,String> req) {
        // ResponseObject<Channel> res=new ResponseObject<>();
        ResponseObject<String> res=vserve.signalForFinshUpload(req);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/watch/{videoId}")
    public ResponseEntity<?> videoWatch(@PathVariable(name = "videoId") String videoId) {
        return ResponseEntity.ok(vserve.videoWatch(videoId));
    }
    
    @GetMapping("/like/{videoId}")
    public ResponseEntity<?> likeVideo(@PathVariable(name = "videoId") String videoId) {
        
        return ResponseEntity.ok(vserve.videoLike(videoId));
    }
    @GetMapping("/dislike/{videoId}")
    public ResponseEntity<?> dislikeVideo(@PathVariable(name = "videoId") String videoId) {
        
        return ResponseEntity.ok(vserve.videoDislike(videoId));
    }

    @GetMapping("/owner/seeVideos")
    public ResponseEntity<?> seeVideosOwner() {
        return ResponseEntity.ok(vserve.seeVideosOwner());
    }
    @GetMapping("/owner/deleteVideo/{videoId}")
    public ResponseEntity<?> delteVideo(@PathVariable(name="videoId") Long videoId) {
        return ResponseEntity.ok(vserve.deleteVideo(videoId));
    }
    @GetMapping("/owner/makePrivate/{videoId}")
    public ResponseEntity<?> makePrivate(@PathVariable(name="videoId") Long videoId) {
        return ResponseEntity.ok(vserve.makePrivate(videoId));
    }
    @GetMapping("/owner/makePublic/{videoId}")
    public ResponseEntity<?> makePublic(@PathVariable(name="videoId") Long videoId) {
        return ResponseEntity.ok(vserve.makePublic(videoId));
    }
    @PostMapping("/seeHomeVideos")
    public ResponseEntity<?> seeHomeVideos(@RequestBody Map<String,Integer> mp) {
        return ResponseEntity.ok(vserve.seeVideosHomepage(mp.get("page"),mp.get("size")));
    }
    @PostMapping("/comment")
    public ResponseEntity<?> commentOnVideo(@RequestBody Map<String,String> mp) {
        return ResponseEntity.ok(vserve.commentOnVideo(Long.valueOf(mp.get("videoId")),mp.get("content")));
    }
    
    
    // @PostMapping("/processed")
    // public ResponseEntity<?> webHookForProcessed(@RequestHeader(value="token",required = true) String token,@RequestBody Map<String,String> req) {
    //     ResponseObject<String> res=vserve.finishedProcessing(token,req);
    //     return ResponseEntity.ok(res);
    // }
}
 