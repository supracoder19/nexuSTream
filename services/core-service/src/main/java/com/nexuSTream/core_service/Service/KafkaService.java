package com.nexuSTream.core_service.Service;

import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
import com.nexuSTream.core_service.Repository.UserRepo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.nexuSTream.core_service.DTO.Event;
import com.nexuSTream.core_service.DTO.UnifiedNotificationEvent;
import com.nexuSTream.core_service.Models.Notification;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Models.Video;
import com.nexuSTream.core_service.Repository.VideoRepo;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class KafkaService {
    // private final String topic = "videoUploaded";
    private final String topicForProcessed = "videoProcessed";
    private final String group = "kafka-tutorial-group";

    @Autowired
    public KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private VideoRepo vrepo;
    @Autowired
    private NotificationRepo nrepo;
    @Autowired
    private SubRepo srepo;
     @Autowired
    private UserRepo urepo;

    public void publish(String topic, Event<?> event) {
        kafkaTemplate.send(topic, event.getKey(), event.getValue());
        log.info("Sent message: {}", event);
    }

    @Value("${S3_BASE_URL}")
    private String BaseUrl = "http://localhost:9000/nexustream/";

    @KafkaListener(topics = topicForProcessed, groupId = group)
    public void listen(Event<?> event) {
        log.info("Received event: {}", event);
        try {
            String videoId = event.getKey();
            if (videoId != null) {
                Video video = vrepo.findById(Long.valueOf(videoId)).orElse(null);
                if (video != null) {
                    String path = BaseUrl + videoId + "/processed/master.m3u8";
                    video.setProcessed(true);
                    video.setVideoUrl(path);
                    vrepo.save(video);
                    User owner = video.getChannel().getOwner();
                    Notification n = new Notification();
                    n.setType("VIDEO_READY");
                    n.setContent("your video " + video.getTitle() + " is live!");
                    n.setRecipient(video.getChannel().getOwner());
                    n.setVideoId(video.getId());
                    nrepo.save(n);
                    List<Long> subs= srepo.findByChannelCustom(video.getChannel());
                    subs.stream().forEach((Long id)->{
                        User u = urepo.findById(id).orElse(null);
                        if(u==null) return;
                        Notification n1 = new Notification();
                        n1.setType("NEW_VIDEO");
                    n1.setContent("A new video "+video.getTitle()+" was just uploaded by "+video.getChannel().getOwner().getUsername());
                    n1.setRecipient(u);
                    n1.setVideoId(video.getId());
                    nrepo.save(n1);
                    });
                    Map<String, Object> mp = new HashMap<>();
                    mp.put("videoTitle", video.getTitle());
                    UnifiedNotificationEvent value = new UnifiedNotificationEvent("video ready", owner.getId(),
                            owner.getUsername(), srepo.findByChannelCustom(video.getChannel()), mp);
                    Event<UnifiedNotificationEvent> event2 = new Event<>("processed Notification", value);

                    publish("notification", event2);
                } else {
                    throw new Exception("no video found");
                }
            } else
                throw new Exception("no videoId found");
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}
