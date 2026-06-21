package com.nexuSTream.core_service.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexuSTream.core_service.DTO.Event;
import com.nexuSTream.core_service.DTO.QueueMessage;
import com.nexuSTream.core_service.DTO.UnifiedNotificationEvent;
import com.nexuSTream.core_service.Models.Notification;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Models.Video;
import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
import com.nexuSTream.core_service.Repository.UserRepo;
import com.nexuSTream.core_service.Repository.VideoRepo;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class QueueConsumer implements CommandLineRunner {

    @Resource(name = "queueRedisTemplate")
    private StringRedisTemplate queue;

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${topic.video.processed}")
    private String videoProcessedTopic;
    
    @Value("${topic.notification}")
    private String notificationTopic;
    
    @Value("${S3_BASE_URL}")
    private String BaseUrl;

    private final VideoRepo vrepo;
    private final NotificationRepo nrepo;
    private final SubRepo srepo;
    private final UserRepo urepo;

    private final RedisService red;

    @Override
    @Async // Tells Spring to run this entire method execution on a dedicated background thread pool
    public void run(String... args) {
        String queueKey = "queue:" + videoProcessedTopic;

        // Keep running until the application context shuts down or interrupts the thread
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // Using 5 seconds instead of 0 prevents connection lockups on initial startup
                String result = queue.opsForList().rightPop(queueKey, Duration.ofSeconds(0));

                if (result != null) {
                    QueueMessage<?> msg = mapper.readValue(result, QueueMessage.class);
                    processMessage(msg);
                }
            } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
                System.err.println("Redis connection missing on startup, retrying in 2 seconds...");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } catch (Exception e) {
                System.err.println("Error processing task: " + e.getMessage());
            }
        }
    }

    private void processMessage(QueueMessage<?> msg) {
        if (msg.getTopic().equals(videoProcessedTopic)) {
            System.out.println("\n\n\n  hello " + msg);
            try {
                Event<?> event = msg.getEvent();
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
                        
                        List<Long> subs = srepo.findByChannelCustom(video.getChannel());
                        subs.stream().forEach((Long id) -> {
                            User u = urepo.findById(id).orElse(null);
                            if (u == null) return;
                            Notification n1 = new Notification();
                            n1.setType("NEW_VIDEO");
                            n1.setContent("A new video " + video.getTitle() + " was just uploaded by " + video.getChannel().getOwner().getUsername());
                            n1.setRecipient(u);
                            n1.setVideoId(video.getId());
                            nrepo.save(n1);
                        });
                        
                        Map<String, Object> mp = new HashMap<>();
                        mp.put("videoTitle", video.getTitle());
                        UnifiedNotificationEvent value = new UnifiedNotificationEvent("video ready", owner.getId(),
                                owner.getUsername(), srepo.findByChannelCustom(video.getChannel()), mp);
                        Event<UnifiedNotificationEvent> event2 = new Event<>("processed Notification", value);

                        QueueMessage<UnifiedNotificationEvent> newMsg = new QueueMessage<>(notificationTopic, event2);
                        red.pushTask(newMsg);

                    } else {
                        throw new Exception("no video found");
                    }
                } else {
                    throw new Exception("no videoId found");
                }
            } catch (Exception e) {
                System.out.println(e.getMessage());
            }
        }
    }
}