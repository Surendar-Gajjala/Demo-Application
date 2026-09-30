# Build context is the repo root (see docker-compose.yml) so the image can
# include db/migrations, which the backend applies with Flyway on startup.

FROM maven:3.9-eclipse-temurin-19 AS build
WORKDIR /build
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY backend/src src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:19-jre
RUN groupadd --system app && useradd --system --gid app --home /app app
WORKDIR /app
COPY --from=build /build/target/demo-application-*.jar app.jar
COPY db/migrations /app/db/migrations
ENV FLYWAY_LOCATIONS=filesystem:/app/db/migrations
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
