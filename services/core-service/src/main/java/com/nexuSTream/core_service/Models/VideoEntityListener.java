package com.nexuSTream.core_service.Models;


import com.nexuSTream.core_service.Service.S3Service;
import jakarta.persistence.PostRemove;
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Component;

// @Component
public class VideoEntityListener {

    private S3Service s3Service;

    @Autowired
    public void init(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostRemove
    public void onPostRemove(Video video) {
        if (s3Service == null) return;
        System.out.println(video);
        // Extract and delete video file from S3
        s3Service.deleteKey(String.valueOf(video.getId()));
    }
}