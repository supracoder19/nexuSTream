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


# ==========================================
# Stage 2: Production Run Tier (Named: production)
# ==========================================
FROM openjdk:17-jdk-slim AS production
WORKDIR /app

# Compile the final jar inside the builder stage environment
RUN mvn clean package -DskipTests -f /app/pom.xml

# Copy only the built binary artifact
COPY --from=development /app/target/*.jar app.jar

EXPOSE 8080

# Enforce the RAM safety ceiling for Render
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]