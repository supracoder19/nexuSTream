package com.nexuSTream.core_service.Configuration;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3config {

    @Bean
    public S3Client s3Client(S3propsFromProperties props) {
        return S3Client.builder()
                .endpointOverride(URI.create(props.adminEndpoint()))
                .region(Region.of(props.region()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(props.accessKey(), props.secretKey())
                        )
                )
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(props.pathStyleAccess()) // Cleared the hardcoded 'true||' for neatness
                                .build()
                )
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(S3propsFromProperties props) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(props.endpoint()))
                .region(Region.of(props.region()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(props.accessKey(), props.secretKey())
                        )
                )
                // ADD THIS BLOCK TO FIX THE PRESIGNED URL INTERACTION:
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(props.pathStyleAccess()) 
                                .build()
                )
                .build();
    }
}