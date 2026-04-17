package com.smartchat.autoweb.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 启动时保存环境信息到 json/bootInfo.json
 */
@Component
public class BootInfoInitializer implements CommandLineRunner {

    @Value("${app.project-root:../}")
    private String projectRoot;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @Value("${server.port:8080}")
    private String serverPort;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy/M/d HH:mm:ss");

    @Override
    public void run(String... args) throws Exception {
        saveBootInfo();
    }

    private void saveBootInfo() {
        try {
            // 准备数据
            Map<String, Object> bootInfo = new HashMap<>();
            bootInfo.put("name", activeProfile);
            bootInfo.put("date", LocalDateTime.now().format(DATE_FMT));
            bootInfo.put("port", serverPort);

            // 确保目录存在
            Path jsonDir = Path.of(projectRoot, "json");
            if (!Files.exists(jsonDir)) {
                Files.createDirectories(jsonDir);
            }

            // 写入文件
            Path bootInfoFile = jsonDir.resolve("bootInfo.json");
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            mapper.writeValue(bootInfoFile.toFile(), bootInfo);

            System.out.println("[BootInfo] 启动信息已保存: " + bootInfoFile.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("[BootInfo] 保存启动信息失败: " + e.getMessage());
        }
    }
}
