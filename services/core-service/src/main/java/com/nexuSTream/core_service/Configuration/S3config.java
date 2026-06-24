package com.nexuSTream.core_service.Configuration;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3config {

        @Value("${S3_BASE_URL}")
        private String BaseUrl;

        // --- PRIMARY S3 CLIENT ---
        @Bean(name = "processingS3Client")
        @Primary // Makes this the default choice if no qualifier is specified
        public S3Client primaryS3Client(S3propsFromProperties props) {
                return createS3Client(props.region(), props.accessKey(), props.secretKey(), props.pathStyleAccess(),
                                props.endpoint());
        }

        // --- SECONDARY S3 CLIENT ---
        @Bean(name = "watchS3Client")
        public S3Client secondaryS3Client(S3propsFromProperties props) {
                // adjust the endpoint or properties here as needed for your second client
                return createS3Client(props.region_2(), props.accessKey_2(), props.secretKey_2(),
                                props.pathStyleAccess_2(), props.endpoint_2());
        }

        @Bean
        public S3Presigner s3Presigner(S3propsFromProperties props) {
                return S3Presigner.builder()
                                .endpointOverride(URI.create(BaseUrl))
                                .region(Region.of(props.region()))
                                .credentialsProvider(
                                                StaticCredentialsProvider.create(
                                                                AwsBasicCredentials.create(props.accessKey(),
                                                                                props.secretKey())))
                                .serviceConfiguration(
                                                S3Configuration.builder()
                                                                .pathStyleAccessEnabled(props.pathStyleAccess())
                                                                .build())
                                .build();
        }

        // Private helper method to keep your configuration code DRY (Don't Repeat
        // Yourself)
        private S3Client createS3Client(String region, String accessKey, String sercetKey, boolean pathStyle,
                        String endpoint) {
                return S3Client.builder()
                                .endpointOverride(URI.create(endpoint))
                                .region(Region.of(region))
                                .credentialsProvider(
                                                StaticCredentialsProvider.create(
                                                                AwsBasicCredentials.create(accessKey, sercetKey)))
                                .serviceConfiguration(
                                                S3Configuration.builder()
                                                                .pathStyleAccessEnabled(pathStyle)
                                                                .build())
                                .build();
        }
}