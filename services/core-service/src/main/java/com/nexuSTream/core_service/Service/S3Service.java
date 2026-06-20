package com.nexuSTream.core_service.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nexuSTream.core_service.Configuration.S3propsFromProperties;

import lombok.AllArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@AllArgsConstructor
public class S3Service {

        private S3Presigner presigner;
        private S3propsFromProperties props;
        private S3Client s3;

        public String generateUploadUrl(String key, String Size) {
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                                .bucket(props.bucket())
                                .key(key)
                                .contentLength(Long.valueOf(Size))
                                .build();

                PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                                .signatureDuration(Duration.ofMinutes(20))
                                .putObjectRequest(putObjectRequest)
                                .build();

                PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);

                String originalUrl = presignedRequest.url().toString();

                // Inject "/minio/" right after the port/host definition
                // Turns: http://10.154.162.64:8081/nexustream/...
                // Into: http://10.154.162.64:8081/minio/nexustream/...
                String proxyCompatibleUrl = originalUrl.replace(":8081/", ":8081/minio/");

                return proxyCompatibleUrl;
        }

        public void deleteKey(String key) {
                try {
                        if (key == null || key.isBlank()) {
                                System.out.println("S3 delete aborted: Key is null or empty string.");
                                return;
                        }

                        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                                        .bucket(props.bucket())
                                        .key(key)
                                        .build();

                        s3.deleteObject(deleteObjectRequest);
                        System.out.println("Successfully deleted asset from S3 bucket: " + key);

                } catch (Exception e) {
                        // Log the exception securely without interrupting the primary DB transaction if
                        // called downstream
                        System.err.println("Failed to delete asset [" + key + "] from S3: " + e.getMessage());
                }

        }

        public void deleteKeyWithException(String folderKey) throws Exception {
                if (folderKey == null || folderKey.isBlank()) {
                        System.out.println("S3 folder delete aborted: Key is null or empty string.");
                        return;
                }

                // Ensure the folder key ends with a trailing slash so you don't accidentally
                // match prefixes
                // (e.g., matching "folder-backup" when you want to delete "folder")
                String prefix = folderKey.endsWith("/") ? folderKey : folderKey + "/";

                String continuationToken = null;

                // Loop handles pagination if the folder contains more than 1,000 objects
                do {
                        ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                                        .bucket(props.bucket())
                                        .prefix(prefix)
                                        .continuationToken(continuationToken)
                                        .build();

                        ListObjectsV2Response listResponse = s3.listObjectsV2(listRequest);
                        List<S3Object> objects = listResponse.contents();

                        if (!objects.isEmpty()) {
                                // Map the list of S3Objects to ObjectIdentifiers required by the delete API
                                List<ObjectIdentifier> keysToDelete = objects.stream()
                                                .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                                                .collect(Collectors.toList());

                                // Execute batch delete (Up to 1,000 objects per request)
                                DeleteObjectsRequest deleteObjectsRequest = DeleteObjectsRequest.builder()
                                                .bucket(props.bucket())
                                                .delete(d -> d.objects(keysToDelete))
                                                .build();

                                s3.deleteObjects(deleteObjectsRequest);
                                System.out.println(
                                                "Deleted batch of " + keysToDelete.size() + " objects from: " + prefix);
                        }

                        continuationToken = listResponse.nextContinuationToken();
                } while (continuationToken != null);

                System.out.println("Successfully deleted folder and all contents: " + prefix);

        }
}
