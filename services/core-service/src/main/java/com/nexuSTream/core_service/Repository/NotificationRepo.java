package com.nexuSTream.core_service.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.nexuSTream.core_service.DTO.NotificationProjection;
import com.nexuSTream.core_service.Models.Notification;

public interface NotificationRepo extends JpaRepository<Notification, Long> {

    // 1. Optimized Unread Notifications Query using DTO Projection
    @Query("SELECT new com.nexuSTream.core_service.DTO.NotificationProjection(" +
           "  n.content, " +
           "  n.createdAt, " +
           "  n.isRead, " +
           "  n.recipient.id, " + 
           "  n.id, " +
           "  n.type, " +
           "  n.videoId" +
           ") " +
           "FROM Notification n " +
           "WHERE n.recipient.id = :recipientId AND n.isRead = false")
    Page<NotificationProjection> fetchUnreadNotifications( Long recipientId, Pageable pageable);

    // 2. All Notifications Query using DTO Projection
    @Query("SELECT new com.nexuSTream.core_service.DTO.NotificationProjection(" +
           "  n.content, " +
           "  n.createdAt, " +
           "  n.isRead, " +
           "  n.recipient.id, " + 
           "  n.id, " +
           "  n.type, " +
           "  n.videoId" +
           ") " +
           "FROM Notification n " +
           "WHERE n.recipient.id = :recipientId")
    Page<NotificationProjection> findByRecipientId( Long recipientId, Pageable pageable);
}