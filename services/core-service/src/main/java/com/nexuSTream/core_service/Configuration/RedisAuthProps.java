package com.nexuSTream.core_service.Configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "redis.auth")
public record RedisAuthProps(
        String host,
        String port,
        String password
) {}
