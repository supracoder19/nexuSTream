package com.nexuSTream.core_service.DTO;

import java.time.Instant;

public interface CommentProjection {
 Long getId();
 String getAuthor();
 String getContent();
 Instant getCreatedAt();
}