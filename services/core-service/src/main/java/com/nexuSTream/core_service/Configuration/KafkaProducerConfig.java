package com.nexuSTream.core_service.Configuration;

import org.springframework.boot.kafka.autoconfigure.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String,Object> producerFactory(KafkaProperties kafkaProperties) {
        // Passing null tells Spring to build properties without extra SSL bundles
        Map<String, Object> configProps = kafkaProperties.buildProducerProperties();
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
        // Pass the 'producerFactory' variable directly without parentheses
        return new KafkaTemplate<>(producerFactory);
    }
    @Bean
    public CommonErrorHandler errorHandler() {
        // Retry 3 times, waiting 1 second between retries. 
        // If it still fails, it stops processing this message and logs it (or routes to a DLT).
        return new DefaultErrorHandler(new FixedBackOff(1000L, 3L));
    }
}