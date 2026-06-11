package com.nexuSTream.core_service.DTO;

import java.time.LocalDateTime;

public interface VideoListProjection {
    Long getId();
    String getThumbnailUrl();
    Long getViewCount();
    String getTitle();
    Long getLikesCount();
    boolean getPrivate();
    boolean getProcessed();
    LocalDateTime getCreatedAt();
} 
