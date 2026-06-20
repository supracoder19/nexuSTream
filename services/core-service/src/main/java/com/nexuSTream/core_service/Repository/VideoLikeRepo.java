package com.nexuSTream.core_service.Repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.nexuSTream.core_service.Models.CustomUniqueId;
import com.nexuSTream.core_service.Models.VideoLike;


public interface VideoLikeRepo extends JpaRepository<VideoLike,CustomUniqueId>{
    boolean existsById(CustomUniqueId id);
}
