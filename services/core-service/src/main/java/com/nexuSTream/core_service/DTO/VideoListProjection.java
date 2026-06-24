package com.nexuSTream.core_service.DTO;

import java.time.LocalDateTime;

import com.nexuSTream.core_service.Models.ProcessingStatus;

public interface VideoListProjection {
    Long getId();
    String getThumbnailUrl();
    Long getViewCount();
    String getTitle();
    Long getLikesCount();
    boolean getPrivate();
    ProcessingStatus getProcessed();
    LocalDateTime getCreatedAt();
} 
