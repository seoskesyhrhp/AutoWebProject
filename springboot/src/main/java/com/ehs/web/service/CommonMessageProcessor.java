package com.ehs.web.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CommonMessageProcessor {

    private static final String EHP_PATH = "json/ehp/CommonMessageList.json";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static List<JsonNode> getJson(String filePath) {
        try {
            JsonNode root = MAPPER.readTree(new File(filePath));
            JsonNode data = root.path("data");
            JsonNode patrolRouteList = data.path("PatrolRouteList");
            if (patrolRouteList.isArray()) {
                List<JsonNode> list = new ArrayList<>();
                for (JsonNode node : patrolRouteList) {
                    list.add(node);
                }
                return list;
            }
            return Collections.emptyList();
        } catch (IOException e) {
            System.err.println("Error occurred while reading " + filePath + ": " + e.getMessage());
            // 避免接口返回 null，前端更容易做空数据渲染
            return Collections.emptyList();
        }
    }

    public static List<Map<String, Object>> getStatus(List<JsonNode> rows) {
        Map<Integer, Integer> statusCounts = new HashMap<>();
        if (rows != null) {
            for (JsonNode row : rows) {
                int status = row.path("Status").asInt();
                statusCounts.put(status, statusCounts.getOrDefault(status, 0) + 1);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        if (rows != null) {
            for (JsonNode row : rows) {
                Map<String, Object> item = new HashMap<>();
                item.put("CheckCnt", row.path("CheckCnt").asText());
                item.put("CheckAreaCode", row.path("CheckAreaCode").asText());
                item.put(
                    "numberOfElevators",
                    row.path("TemplateList").isArray() ? row.path("TemplateList").size() : 0
                );
                item.put("CheckAreaName", row.path("CheckAreaName").asText());
                results.add(item);
            }
        }

        Map<String, Object> statusItems = new HashMap<>();
        Map<String, Object> statusRows = new HashMap<>();
        statusRows.put("notStarted", statusCounts.getOrDefault(0, 0));
        statusRows.put("inProgress", statusCounts.getOrDefault(10, 0));
        statusRows.put("completed", statusCounts.getOrDefault(20, 0));
        statusRows.put("total", statusCounts.values().stream().mapToInt(Integer::intValue).sum());
        // 兼容前端 app.js：状态字段需要直接在最后一项上
        statusItems.putAll(statusRows);
        results.add(statusItems);
        return results;
    }

}
