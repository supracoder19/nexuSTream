package com.nexuSTream.core_service.DTO;

// import org.springframework.beans.factory.annotation.Value;

public interface ChannelProjection {
    Long getId();
    String getChannelName();
    String getDescription();

    // performance overhead
    // // Safely reads the collection size. 
    // // The Elvis operator (?: 0) handles cases where there are 0 subscribers.
    // @Value("#{target.subscribers != null ? target.subscribers.size() : 0}")
    Long getSubscriberCount();
}