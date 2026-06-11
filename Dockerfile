# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app
COPY pom.xml ./
# Cache Maven dependencies
RUN mvn dependency:go-offline -B
COPY src ./src
# Copy compiled frontend assets into the Spring Boot resource classpath
COPY --from=frontend-builder /app/src/main/resources/static/ ./src/main/resources/static/
RUN mvn clean package -DskipTests -B

# Stage 3: Runtime Environment
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/target/SpringOAuth2-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
