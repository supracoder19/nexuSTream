package com.nexuSTream.core_service.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Qualifier;
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
import com.nexuSTream.core_service.Models.ProcessingStatus;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Models.Video;
import com.nexuSTream.core_service.Repository.NotificationRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
import com.nexuSTream.core_service.Repository.UserRepo;
import com.nexuSTream.core_service.Repository.VideoRepo;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;

@Component
@RequiredArgsConstructor
public class QueueConsumer implements CommandLineRunner {

    @Resource(name = "queueRedisTemplate")
    private StringRedisTemplate queue;

    private static ObjectMapper mapper = new ObjectMapper();

    @Value("${topic.video.processed}")
    private String videoProcessedTopic;

    @Value("${topic.notification}")
    private String notificationTopic;

    @Value("${topic.video.processing.failed}")
    private String videoProcessingFailed;

    @Value("${S3_BASE_URL}")
    private String BaseUrl;

    @Value("${SPRING_ENV}")
    private String springEnv;

    private final VideoRepo vrepo;
    private final NotificationRepo nrepo;
    private final SubRepo srepo;
    private final UserRepo urepo;
    private final S3Service s3;

    @Qualifier("processingS3Client")
    private final S3Client s3_client;

    private final RedisService red;

    @Override
    @Async
    public void run(String... args) {
        String successQueueKey = "queue:" + videoProcessedTopic;
        String failedQueueKey = "queue:" + videoProcessingFailed;

        // Start a dedicated thread loop for successful processing
        CompletableFuture.runAsync(() -> consumeQueue(successQueueKey, videoProcessedTopic));

        // Start a dedicated thread loop for failed processing
        CompletableFuture.runAsync(() -> consumeQueue(failedQueueKey, videoProcessingFailed));
    }

    private void consumeQueue(String queueKey, String topicType) {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            // Guard check: If Spring cleared the factory entirely
            if (queue.getConnectionFactory() == null) {
                System.out.println("Redis factory is null. Exiting loop for " + topicType);
                break;
            }

            // Using a 5-second timeout so the thread periodically wakes up 
            // and can cleanly exit if the app is shutting down.
            String result = queue.opsForList().rightPop(queueKey, Duration.ofSeconds(60));

            if (result != null) {
                QueueMessage<?> msg = mapper.readValue(result, QueueMessage.class);
                processMessage(msg);
            }
        } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
            System.err.println("Redis connection missing for " + topicType + ", retrying in 2 seconds...");
            try {
                Thread.sleep(2000);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        } catch (IllegalStateException | org.springframework.dao.DataAccessResourceFailureException e) {
            // Spring throws these when the factory is closed/destroyed mid-operation
            String msg = e.getMessage();
            if (msg != null && msg.contains("destroyed")) {
                System.out.println("LettuceConnectionFactory was destroyed. Stopping consumer for " + topicType);
                break; // Break the infinite loop!
            }
            
            // Fallback logging if it's a different state error
            System.err.println("State error in " + topicType + ": " + msg);
            safeSleep(1000);
        } catch (Exception e) {
            System.err.println("Error processing " + topicType + " task: " + e.getMessage());
            safeSleep(1000);
        }
    }
}

// Small helper method to keep the catch block clean
private void safeSleep(long millis) {
    try {
        Thread.sleep(millis);
    } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
    }
}

    private void processMessage(QueueMessage<?> msg) {
        if (msg.getTopic().equals(videoProcessedTopic)) {
            try {
                Event<?> event = msg.getEvent();
                String videoId = event.getKey();
                if (videoId != null) {
                    Video video = vrepo.findById(Long.valueOf(videoId)).orElse(null);
                    if (video != null) {
                        String extra =  "development".equals(springEnv)?"/redirect-service/":"";
                        String path =extra+"watch/"+videoId + "_processed/master.m3u8";
                        video.setProcessed(ProcessingStatus.TRUE);
                        video.setPrivate(false);
                        video.setVideoUrl(path);
                        String thumbnailPath =extra+"image/"+videoId +"_processed/thumbnail/"+videoId+".webp";
                        video.setThumbnailUrl(thumbnailPath);
                        vrepo.save(video);

                        s3.deleteKeyWithException(videoId, s3_client);

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
                            if (u == null)
                                return;
                            Notification n1 = new Notification();
                            n1.setType("NEW_VIDEO");
                            n1.setContent("A new video " + video.getTitle() + " was just uploaded by "
                                    + video.getChannel().getOwner().getUsername());
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
        } else if (msg.getTopic().equals(videoProcessingFailed)) {
            try {
                Event<?> event = msg.getEvent();
                String videoId = event.getKey();
                if (videoId != null) {
                    Video video = vrepo.findById(Long.valueOf(videoId)).orElse(null);
                    if (video != null) {
                        video.setPrivate(true);
                        video.setProcessed(ProcessingStatus.FAILED);
                        vrepo.save(video);
                        Map<String, Object> mp = new HashMap<>();
                        User owner=video.getChannel().getOwner();
                        mp.put("videoTitle", video.getTitle());
                        UnifiedNotificationEvent value = new UnifiedNotificationEvent("video processing failed", owner.getId(),
                                owner.getUsername(), srepo.findByChannelCustom(video.getChannel()), mp);
                        Event<UnifiedNotificationEvent> event2 = new Event<>("processing failed Notification", value);
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