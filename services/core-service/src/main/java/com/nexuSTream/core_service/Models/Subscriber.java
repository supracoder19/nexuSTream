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
@Getter @Setter @NoArgsConstructor
@Table(name = "subscribers")
public class Subscriber {
    @EmbeddedId
    private CustomUniqueId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("oneId")
    @JoinColumn( name = "channel_id",referencedColumnName = "id")
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("otherId")
    @JoinColumn( name = "sub_id",referencedColumnName = "id")
    private User sub;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;


    public Subscriber(Channel channel, User sub) {
        this.channel = channel;
        this.sub = sub;
        // this.id = new CustomUniqueId(channel.getId(), sub.getId());
        this.id=new CustomUniqueId();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
