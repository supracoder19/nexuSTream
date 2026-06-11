package com.nexuSTream.core_service.Service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class RedisCache {
    @Autowired
    private StringRedisTemplate redisTemplate;

    public void saveData(String key, String value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public String getData(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteData(String key)
    {
        redisTemplate.delete(key);
    }
}