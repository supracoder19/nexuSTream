
# ==========================================
# Stage 1: Development & Build Base (Named: development)
# ==========================================
FROM maven:3.8.5-openjdk-17 AS development
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY . .

# Expose standard local port
EXPOSE 8080

# Local Development Command (Supports Spring DevTools Live Reload)
CMD ["mvn", "spring-boot:run"]

FROM maven:3.8.5-openjdk-17 AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY . .

# RUN THE COMPILATION HERE (Inside Stage 1 where Maven exists)
# This creates the target/core-service-0.0.1-SNAPSHOT.jar file
RUN mvn clean package -DskipTests


# ==========================================
# Stage 2: Production Run Tier (Named: production)
# ==========================================
FROM eclipse-temurin:17-jre-jammy AS production
WORKDIR /app

# Copy the pre-built jar file directly from the development stage filesystem
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# Enforce the RAM safety ceiling for Render
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]