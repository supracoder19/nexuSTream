package com.nexuSTream.core_service.Configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@EnableCaching
public class CacheConfig {

    // Added a default fallback string just in case the property is missing
    @Value("${spring.cache.caffeine.spec:expireAfterWrite=1m,maximumSize=200}")
    private String cacheSpec;

    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheSpecification(cacheSpec);
        return cacheManager;
    }
}