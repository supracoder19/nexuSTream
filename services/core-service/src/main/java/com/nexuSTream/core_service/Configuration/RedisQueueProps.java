package com.nexuSTream.core_service.Configuration;


import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "redis.queue")
public record RedisQueueProps(
        String host,
        String port,
        String password
) {}
