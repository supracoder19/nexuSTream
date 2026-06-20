package com.nexuSTream.core_service.Service;

import org.springframework.data.redis.core.StringRedisTemplate;

public class RedisMessagePublisher {
    private StringRedisTemplate redisTemplate;

    public void publish(String message) {
        redisTemplate.convertAndSend("my-channel", message);
    }
}
