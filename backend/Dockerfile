# Stage 1: Build the Spring Boot fat JAR with Java 25
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src/ src/
RUN ./mvnw package -DskipTests -Dspotless.check.skip=true -B

# Stage 2: Minimal JRE 25 runtime image with non-root user
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN groupadd --system veryfact && useradd --system --gid veryfact veryfact
USER veryfact:veryfact

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

