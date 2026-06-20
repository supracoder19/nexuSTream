package com.nexuSTream.core_service.Configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RedisAuthProps.class)
public class RedisRegisterAuthProps {
}
