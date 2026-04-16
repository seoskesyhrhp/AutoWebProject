FROM eclipse-temurin:17-jre

WORKDIR /app

# 瘦包 Jar（templates 已在 Jar 内）；static 单独拷贝以控制镜像体积
COPY springboot/target/autoweb-springboot-*.jar app.jar
COPY static /app/static

EXPOSE 8000

ENTRYPOINT ["java", "-jar", "/app/app.jar", "--spring.profiles.active=prod"]
