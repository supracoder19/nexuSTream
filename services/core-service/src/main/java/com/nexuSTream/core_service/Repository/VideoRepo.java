package com.nexuSTream.core_service.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nexuSTream.core_service.DTO.VideoListProjection;
import com.nexuSTream.core_service.Models.Video;

@Repository
public interface VideoRepo extends JpaRepository<Video, Long> {
    @Query("SELECT v.id AS id, " +
       "v.thumbnailUrl AS thumbnailUrl, " +
       "v.title AS title, " +
       "COUNT(l) AS likesCount, " +
       "v.createdAt AS createdAt, " +
       "v.isPrivate AS private, " +
       "v.processed AS processed, " +
       "v.viewCount AS viewCount " +
       "FROM Video v " +
       "LEFT JOIN v.likes l " +
       "WHERE v.channel.id = :channelId " +
       "GROUP BY v.id, v.thumbnailUrl, v.title, v.createdAt, v.isPrivate, v.processed, v.viewCount")
List<VideoListProjection> fetchCustomVideoListOwner(Long channelId);
    @Query("SELECT v.id AS id, " +
            "v.thumbnailUrl AS thumbnailUrl, " +
            "v.title AS title, " +
            "COUNT(l) AS likesCount ," +
            "v.createdAt AS createdAt ," +
            "v.isPrivate AS private ," +
            "v.processed AS processed ," +
            "v.viewCount AS viewCount " +
            "FROM Video v " +
            "LEFT JOIN v.likes l " +
            "WHERE v.channel.id = :channelId and" +
            " v.processed = :showProcessed and " +
            " v.isPrivate = :showPrivate " +
            "GROUP BY v.id")
    List<VideoListProjection> fetchCustomVideoList(Long channelId,boolean showPrivate, boolean showProcessed);
    @Query("SELECT v.id AS id, " +
           "v.thumbnailUrl AS thumbnailUrl, " +
           "v.title AS title, " +
           "COUNT(l) AS likesCount, " +
           "v.createdAt AS createdAt, " +
           "v.isPrivate AS private, " +
           "v.processed AS processed, " +
           "v.viewCount AS viewCount " +
           "FROM Video v " +
           "LEFT JOIN v.likes l " +
           "WHERE v.isPrivate = false AND v.processed = true " +
           "GROUP BY v.id, v.thumbnailUrl, v.title, v.createdAt, v.isPrivate, v.processed, v.viewCount")
    Page<VideoListProjection> fetchDiscoverableVideosPaged(Pageable pageable);
}
