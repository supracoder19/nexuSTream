package com.nexuSTream.core_service.Configuration;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RedisConfig {

    @Value("${SPRING_ENV:production}")
    private String springEnv;

    // Helper method configuration logic
    private LettuceClientConfiguration getClientConfig() {
        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder();
        if (!"development".equalsIgnoreCase(springEnv)) {
            builder.useSsl();
        }
        return builder.commandTimeout(Duration.ZERO).build();
    }

    // 1. Define and Initialize Auth Factory Bean
    @Bean(name = "authConnectionFactory")
    public LettuceConnectionFactory authConnectionFactory(RedisAuthProps redAuth) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
            redAuth.host(), 
            Integer.parseInt(redAuth.port())
        );
        config.setPassword(redAuth.password());
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, getClientConfig());
        // CRITICAL: Force initialization since we are configuring manually
        factory.afterPropertiesSet(); 
        return factory;
    }

    // 2. Define and Initialize Queue Factory Bean
    @Primary
    @Bean(name = "queueConnectionFactory")
    public LettuceConnectionFactory queueConnectionFactory(RedisQueueProps redQueue) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
            redQueue.host(), 
            Integer.parseInt(redQueue.port())
        );
        config.setPassword(redQueue.password());
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, getClientConfig());
        // CRITICAL: Force initialization since we are configuring manually
        factory.afterPropertiesSet(); 
        return factory;
    }

    // 3. Inject explicitly into your distinct templates
    @Bean(name = "authRedisTemplate")
    public StringRedisTemplate authRedisTemplate(@Qualifier("authConnectionFactory") LettuceConnectionFactory authConnectionFactory) {
        return new StringRedisTemplate(authConnectionFactory);
    }

    @Bean(name = "queueRedisTemplate")
    public StringRedisTemplate queueRedisTemplate(@Qualifier("queueConnectionFactory") LettuceConnectionFactory queueConnectionFactory) {
        return new StringRedisTemplate(queueConnectionFactory);
    }
}