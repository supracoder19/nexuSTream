package com.nexuSTream.core_service.DTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChannelDescriptionResponse {
    private Long channelId;
    private String channelName;
    private boolean subscribed;
    private String description;
    private Long subscriberCount;
    private List<VideoListProjection> videos;
}
