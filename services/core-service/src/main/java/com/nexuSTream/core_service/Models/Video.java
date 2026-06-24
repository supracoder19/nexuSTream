package com.nexuSTream.core_service.Models;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.annotation.Nullable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
// import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(name = "videos")
@Getter @Setter @NoArgsConstructor
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id; 

    // Many videos can belong to one Channel
    @ManyToOne
    @JoinColumn(name = "channel_id", nullable = false,referencedColumnName = "id")
    private Channel channel;

    @Nullable
    private String thumbnailUrl=null;
    @Nullable
    private String videoUrl=null;

    @Enumerated(EnumType.STRING)
    @Column(name = "processed", nullable = false)
    private ProcessingStatus processed = ProcessingStatus.FALSE;

    private long viewCount=0;

    private String title="new video";

    private boolean isPrivate=false;

    private String description="new video description";
    private LocalDateTime createdAt;
 
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Column(name = "video_size", nullable = false)
    private Long videoSize;

    //mapped by uses the var name of video in VideoLike table
    @OneToMany(mappedBy = "video" , cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<VideoLike> likes;

    //mapped by uses the var name of video in VideoLike table
    @OneToMany(mappedBy = "video" , cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments;
}
