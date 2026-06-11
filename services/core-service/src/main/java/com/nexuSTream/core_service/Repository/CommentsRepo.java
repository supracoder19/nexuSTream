package com.nexuSTream.core_service.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.nexuSTream.core_service.DTO.CommentProjection;
import com.nexuSTream.core_service.Models.Comment;
import com.nexuSTream.core_service.Models.Video;
import java.util.List;


public interface CommentsRepo extends JpaRepository<Comment,Long>{
    // List<Comment> findByVideo(Video video);
    @Query("SELECT c.id AS id, " +
           "c.user.username AS author, " +
           "c.content AS content, " +
           "c.createdAt AS createdAt " +
           "FROM Comment c " +
           "WHERE c.video = :video " +
           "ORDER BY c.createdAt DESC")
    List<CommentProjection> findByVideo(Video video);
}
