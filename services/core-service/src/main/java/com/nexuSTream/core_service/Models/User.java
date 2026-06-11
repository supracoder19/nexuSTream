package com.nexuSTream.core_service.Models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id; 

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @OneToOne(mappedBy = "owner",cascade = CascadeType.ALL)
    @JoinColumn(name = "channel_id",referencedColumnName = "id")
    @JsonIgnore
    private Channel channel;

    private LocalDateTime createdAt;
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    // // Feature flags instead of Roles
    // @Column(nullable = false)
    // private boolean canLiveStream = true; 

    // @Column(nullable = false)
    // private String channelName;

    //  @Column(nullable = false)
    // private String channelDesc;

    // @Column(nullable = false)
    // private boolean canPublish = true;

    // @Column(nullable = false)
    // private long subscriberCount = 0;

    // @OneToMany( mappedBy = "creator", cascade = CascadeType.ALL ,fetch = FetchType.LAZY)
    // private List<Subscriber> subs;

    // @OneToMany(mappedBy = "creatorId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<Video> videos;

    // --- Spring Security UserDetails Methods ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Since they have no formal role, we can pass a custom permission string 
        // or a default standard authority like "ROLE_USER" if required by your filters.
        return List.of(new SimpleGrantedAuthority("no role"));
    }
    //already implemented in interface

    // @Override
    // public boolean isAccountNonExpired() {
    //     return true;
    // }
    // @Override
    // public boolean isAccountNonLocked() {
    //     return true;
    // }

    // @Override
    // public boolean isCredentialsNonExpired() {
    //     return true;
    // }

    // @Override
    // public boolean isEnabled() {
    //     return true;
    // }
}