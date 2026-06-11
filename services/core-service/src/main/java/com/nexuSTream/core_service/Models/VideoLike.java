package com.nexuSTream.core_service.Models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "VideoLikes")
@Getter @Setter @NoArgsConstructor
public class VideoLike
{
    @EmbeddedId
    private CustomUniqueId id;

    // Maps the userId inside the composite key to the actual User entity
    @ManyToOne(fetch = FetchType.LAZY)
    //mapsId maps the embeded Id generator
    @MapsId("oneId")
    @JoinColumn(name = "user_id")
    private User user;

    // Maps the videoId inside the composite key to the actual Video entity
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("otherId")
    @JoinColumn(name = "video_id")
    private Video video;

    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public VideoLike(User user, Video video) {
        this.user = user;
        this.video = video;
        this.id = new CustomUniqueId(user.getId(), video.getId());
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}