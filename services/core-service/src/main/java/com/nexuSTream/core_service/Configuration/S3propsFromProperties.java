package com.nexuSTream.core_service.Configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aws.s3")
public record S3propsFromProperties(
        String endpoint,
        String region,
        String accessKey,
        String secretKey,
        String bucket,
        boolean pathStyleAccess,

        String endpoint_2,
        String region_2,
        String accessKey_2,
        String secretKey_2,
        String bucket_2,
        boolean pathStyleAccess_2
) {}


