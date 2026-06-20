package com.nexuSTream.core_service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nexuSTream.core_service.Models.Channel;
import com.nexuSTream.core_service.Models.CustomUniqueId;
import com.nexuSTream.core_service.Models.Subscriber;
import com.nexuSTream.core_service.Models.User;


@Repository
public interface SubRepo extends JpaRepository<Subscriber,CustomUniqueId>{
    Long countByChannelId(Long channelId);
    Optional<Subscriber> findById(CustomUniqueId id);
    boolean existsBy(CustomUniqueId id);
    @Query(
        "Select s.sub.id as id from Subscriber as s where  s.channel = :channel"
    )
    List<Long> findByChannelCustom(Channel channel);
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
       "FROM Subscriber s " +
       "WHERE s.channel = :channel AND s.sub = :sub")
boolean customExistsBy(Channel channel,User sub);
}
