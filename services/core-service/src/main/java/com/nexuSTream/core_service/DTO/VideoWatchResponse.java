package com.nexuSTream.core_service.DTO;

import java.util.List;


import lombok.Data;

@Data
public class VideoWatchResponse {
    private final String videoUrl;
    private final String title;
    private final String thumbnailUrl;
    private final boolean isLiked;
    private final boolean isSubscribed;
    private final Long channelId;
    private final Long videoId;
    private final List<CommentProjection> comments;
    private final String channelName;
}
