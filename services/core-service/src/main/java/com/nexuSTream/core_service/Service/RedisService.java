package com.nexuSTream.core_service.Service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexuSTream.core_service.DTO.QueueMessage;

import jakarta.annotation.Resource;


@Service
public class RedisService {
    private ObjectMapper mapper= new ObjectMapper();

    @Resource(name = "authRedisTemplate")
    private StringRedisTemplate auth;

    @Resource(name = "queueRedisTemplate")
    private StringRedisTemplate queue;

    public void addAuthData(String key,String value)
    {
        auth.opsForValue().set(key,value);
    }

    @Cacheable(value = "refresToken", key = "#key")
    public String getAuthData(String key) {
        return auth.opsForValue().get(key);
    }

    @CacheEvict(value = "refresToken", key = "#key")
    public void deleteAuthData(String key)
    {
        auth.delete(key);
    }

    public void pushTask(QueueMessage<?> msg) {
        try {
            String value=mapper.writeValueAsString(msg);
            queue.opsForList().leftPush("queue:" + msg.getTopic(),value);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}
