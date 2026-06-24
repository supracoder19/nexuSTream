package com.nexuSTream.core_service.DTO;

import lombok.Data;

@Data
public class VideoUploadReq {
        private String userId;
        private String videoType;
        private String thumbnailType;
        private String title;
        private String description;
        private Long videoSize;
        private String thumbnailSize;
}
