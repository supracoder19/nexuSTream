package com.nexuSTream.core_service.DTO;

import java.util.List;
import java.util.Map;

public record UnifiedNotificationEvent(
    String type,          // "NEW_VIDEO", "LIKE", "COMMENT", "REPLY"
    Long actorId,       // Who triggered it (e.g., the liker or commenter)
    String actorName,     // e.g., "John Doe"
    List<Long> targetIds, // Batch of user IDs receiving this notification
    Map<String, Object> metadata // Dynamic properties (videoId, commentText, etc.)
) {}
