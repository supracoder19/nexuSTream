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

    // 1. Helper method creates the factory, but DOES NOT start it
    private LettuceConnectionFactory createConnectionFactory(String host, int port, String password) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        config.setPassword(password);

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder();
        System.out.println(host+port+password+"        \n\n\n"+springEnv);
        if (!"development".equalsIgnoreCase(springEnv)) {
            builder.useSsl();
        }

        return new LettuceConnectionFactory(config, builder.commandTimeout(Duration.ZERO).build());
    }

    // 2. Define Factory Beans explicitly
    @Bean(name = "authConnectionFactory")
    public LettuceConnectionFactory authConnectionFactory(RedisAuthProps redAuth) {
        return createConnectionFactory(redAuth.host(), Integer.parseInt(redAuth.port()), redAuth.password());
    }

    @Primary
    @Bean(name = "queueConnectionFactory")
    public LettuceConnectionFactory queueConnectionFactory(RedisQueueProps redQueue) {
        return createConnectionFactory(redQueue.host(), Integer.parseInt(redQueue.port()), redQueue.password());
    }

    // 3. Inject the managed Factories into the Templates
    @Bean(name = "authRedisTemplate")
    public StringRedisTemplate authRedisTemplate(@Qualifier("authConnectionFactory") LettuceConnectionFactory authConnectionFactory) {
        return new StringRedisTemplate(authConnectionFactory);
    }

    @Bean(name = "queueRedisTemplate")
    public StringRedisTemplate queueRedisTemplate(@Qualifier("queueConnectionFactory") LettuceConnectionFactory queueConnectionFactory) {
        return new StringRedisTemplate(queueConnectionFactory);
    }
}