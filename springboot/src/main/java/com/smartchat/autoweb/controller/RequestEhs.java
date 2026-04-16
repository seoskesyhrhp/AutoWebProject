package com.smartchat.autoweb.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@RestController
public class RequestEhs {
    @Value("${app.project-root:../}")
    private String projectRoot;
    private static final String BASE_URL = "https://ehs.sispark.com.cn:8443/api/v2/HDCheckTask/GetDetailByCode";
    private static final String COOKIE = ".AspNetCore.Session=ZDI2NTIxZTQtZmM1MS00NDgzLTEwZWQtZjgyZDFiMTAzYmRl";
    private static final String USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping({"/requestDetailData", "/requestDetailData/"})
    public ResponseEntity<List<Object>> requestDetailData(
            @RequestParam String ctCode,
            @RequestParam(defaultValue = "false") boolean enableTest) {

        try {
            if (enableTest) {
                return ResponseEntity.ok(readTestFile());
            }
            Path file = Path.of(projectRoot, "json", "ehp", "CommonMessageList.json");
            Files.createDirectories(file.getParent());

            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Cookie", COOKIE);

            // 发送请求
            String url = BASE_URL + "?ctCode=" + ctCode;
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();

            // 解析响应
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode dataNode = rootNode.path("data");
            JsonNode patrolRouteListNode = dataNode.path("PatrolRouteList");

            // 保存响应到文件
            objectMapper.writeValue(file.toFile(), rootNode);

            // 转换为List返回
            List<Object> patrolRouteList = objectMapper.convertValue(patrolRouteListNode, List.class);
            return ResponseEntity.ok(patrolRouteList);

        } catch (Exception e) {
            System.err.println("发生错误: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    private List<Object> readTestFile() {
        try {
            Path file = Path.of(projectRoot, "json", "ehp", "CommonMessageList.json");
            JsonNode rootNode = objectMapper.readTree(file.toFile());
            JsonNode dataNode = rootNode.path("data");
            JsonNode patrolRouteListNode = dataNode.path("PatrolRouteList");
            return objectMapper.convertValue(patrolRouteListNode, List.class);
        } catch (IOException e) {
            System.err.println("读取测试文件失败: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}

