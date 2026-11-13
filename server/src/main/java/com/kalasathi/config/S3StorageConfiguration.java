package com.kalasathi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration(proxyBeanMethods = false)
public class S3StorageConfiguration {
    @Bean(destroyMethod = "close")
    S3Client s3Client(
            @Value("${app.storage.aws-region}") String region,
            @Value("${app.storage.s3.endpoint}") String endpoint,
            @Value("${app.storage.s3.access-key-id}") String accessKeyId,
            @Value("${app.storage.s3.secret-access-key}") String secretAccessKey) {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider(accessKeyId, secretAccessKey));
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }
        return builder.build();
    }

    @Bean(destroyMethod = "close")
    S3Presigner s3Presigner(
            @Value("${app.storage.aws-region}") String region,
            @Value("${app.storage.s3.endpoint}") String endpoint,
            @Value("${app.storage.s3.access-key-id}") String accessKeyId,
            @Value("${app.storage.s3.secret-access-key}") String secretAccessKey) {
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider(accessKeyId, secretAccessKey));
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }
        return builder.build();
    }

    private static AwsCredentialsProvider credentialsProvider(String accessKeyId, String secretAccessKey) {
        boolean hasAccessKey = !accessKeyId.isBlank();
        boolean hasSecretKey = !secretAccessKey.isBlank();
        if (hasAccessKey != hasSecretKey) {
            throw new IllegalStateException(
                    "Configure both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or use the AWS default credential chain.");
        }
        if (hasAccessKey) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey));
        }
        return DefaultCredentialsProvider.create();
    }
}
