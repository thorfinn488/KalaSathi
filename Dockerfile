FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY server/pom.xml ./server/pom.xml
COPY server/src ./server/src
RUN mvn -f server/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre
RUN useradd --system --uid 10001 appuser
WORKDIR /app
COPY --from=build --chown=appuser:appuser /workspace/server/target/kalasathi-server-1.0.0-SNAPSHOT.jar /app/app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
