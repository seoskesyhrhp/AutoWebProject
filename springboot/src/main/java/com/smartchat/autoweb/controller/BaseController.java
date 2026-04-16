package com.smartchat.autoweb.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class BaseController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Value("${app.project-root:../}")
    private String projectRoot;

    private final ObjectMapper objectMapper;

    public BaseController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @GetMapping("/index")
    public Object root() {
        Path dateFile = Path.of(projectRoot, "json", "date", "RecordCode_" + LocalDate.now().format(DATE_FMT) + ".json");
        if (Files.exists(dateFile)) {
            try {
                List<Map<String, Object>> rows = objectMapper.readValue(dateFile.toFile(), new TypeReference<>() {
                });
                if (!rows.isEmpty()) {
                    Object url = rows.get(0).get("url");
                    if (url instanceof String u && !u.isBlank()) {
                        return new RedirectView(u);
                    }
                }
            } catch (IOException ignored) {
                // Keep response compatible with original fallback semantics.
            }
        }
        return Map.of("message", "欢迎使用浏览器自动化API, 当天任务还未派发, 请稍后再试");
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "healthy");
    }

    @PostMapping("/getSystemProgram/")
    public ResponseEntity<Map<String, Object>> getSystemProgram() {
        Path monitorFile = Path.of(projectRoot, "json", "monitor.json");
        try {
            Object data = objectMapper.readValue(monitorFile.toFile(), Object.class);
            return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "fail", "err", e.getMessage()));
        }
    }

    @PostMapping("/SystemProgram/")
    public ResponseEntity<Map<String, Object>> systemProgram(@RequestBody(required = false) Map<String, Object> body) {
        String pid = body == null ? "" : String.valueOf(body.getOrDefault("pid", ""));
        Map<String, Object> data = new HashMap<>();
        data.put("pid", pid);
        data.put("message", "Spring Boot 版本暂不执行 kill 命令，仅回传参数");
        return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", data));
    }

    @PostMapping("/SystemProgram/all/")
    public ResponseEntity<Map<String, Object>> systemProgramAll(@RequestBody(required = false) Map<String, Object> body) {
        String argv = body == null ? "" : String.valueOf(body.getOrDefault("argv", ""));
        Map<String, Object> data = new HashMap<>();
        data.put("argv", argv);
        data.put("message", "Spring Boot 版本暂不执行 stop/killall 命令，仅回传参数");
        return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", data));
    }
}
