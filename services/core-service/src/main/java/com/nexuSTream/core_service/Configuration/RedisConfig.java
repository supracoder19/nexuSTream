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

    /**
     * Builds a clean client configuration instance for each factory.
     * Replaced Duration.ZERO with a 5-second production safety timeout.
     */
    private LettuceClientConfiguration createLettuceClientConfig() {
        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(90)); // Prevents infinite thread blocking on Render

        if (!"development".equalsIgnoreCase(springEnv)) {
            builder.useSsl(); // Properly triggers rediss:// for Upstash
        }
        
        return builder.build();
    }

    // 1. Define Auth Factory Bean
    @Bean(name = "authConnectionFactory")
    public LettuceConnectionFactory authConnectionFactory(RedisAuthProps redAuth) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
            redAuth.host(), 
            Integer.parseInt(redAuth.port())
        );
        config.setPassword(redAuth.password());
        
        // Spring lifecycle automatically handles afterPropertiesSet() natively
        return new LettuceConnectionFactory(config, createLettuceClientConfig());
    }

    // 2. Define Queue Factory Bean
    @Primary
    @Bean(name = "queueConnectionFactory")
    public LettuceConnectionFactory queueConnectionFactory(RedisQueueProps redQueue) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
            redQueue.host(), 
            Integer.parseInt(redQueue.port())
        );
        config.setPassword(redQueue.password());
        
        return new LettuceConnectionFactory(config, createLettuceClientConfig());
    }

    // 3. Explicitly injected templates
    @Bean(name = "authRedisTemplate")
    public StringRedisTemplate authRedisTemplate(@Qualifier("authConnectionFactory") LettuceConnectionFactory authConnectionFactory) {
        return new StringRedisTemplate(authConnectionFactory);
    }

    @Bean(name = "queueRedisTemplate")
    public StringRedisTemplate queueRedisTemplate(@Qualifier("queueConnectionFactory") LettuceConnectionFactory queueConnectionFactory) {
        return new StringRedisTemplate(queueConnectionFactory);
    }
}