package com.nexuSTream.core_service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nexuSTream.core_service.DTO.ChannelProjection;
// import com.nexuSTream.core_service.DTO.VideoListProjection;
import com.nexuSTream.core_service.Models.Channel;

@Repository
public interface ChannelRepo extends JpaRepository<Channel, Long> {
       @Query("SELECT c.id AS id, " +
                     "c.channelName AS channelName, " +
                     "c.description AS description, " +
                     "COUNT(s) AS subscriberCount " +
                     "FROM Channel c " +
                     "LEFT JOIN c.subscribers s " +
                     "WHERE LOWER(c.channelName) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     "GROUP BY c.id, c.channelName, c.description")
       List<ChannelProjection> findByChannelNameContaining(String query);

       @Query("SELECT c.id AS id, " +
                     "c.channelName AS channelName, " +
                     "c.description AS description, " +
                     "COUNT(s) AS subscriberCount " +
                     "FROM Channel c " +
                     "LEFT JOIN c.subscribers s " +
                     "WHERE c.id = :id")
       Optional<ChannelProjection> findProjectedById(Long id);

       
}
