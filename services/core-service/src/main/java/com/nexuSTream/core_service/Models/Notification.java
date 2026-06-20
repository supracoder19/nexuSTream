package com.nexuSTream.core_service.Models;

import java.time.Instant;

import jakarta.annotation.Nullable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data @NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",referencedColumnName = "id")
    private User recipient;

    private String type;
    @Nullable
    private Long videoId=null;

    // Changed field name to 'isRead' to natively match standard Jackson/JSON generation specs for your React layout
    @Column(name = "is_read")
    private Boolean isRead = false;
    private Instant createdAt;
    @PrePersist
    protected void onCreate()
    {
        this.createdAt=Instant.now();
    }
}