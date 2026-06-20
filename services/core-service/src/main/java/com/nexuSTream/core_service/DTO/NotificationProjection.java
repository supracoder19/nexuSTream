package com.nexuSTream.core_service.DTO;

import java.time.Instant;

public record NotificationProjection(
    String content,
    Instant createdAt,
    Boolean isRead,
    Long recipientId,
    Long id,
    String type,
    Long videoId
) {
    
}
