package com.ehs.web;

import com.smartchat.autoweb.controller.EhsController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api")
public class ListController {

    private final Random random = new Random();

    private final EhsController ehsController;

    public ListController(EhsController ehsController) {
        this.ehsController = ehsController;
    }

    @PostMapping({"/list", "/list/"})
    public ResponseEntity<Map<String, Object>> getList(@RequestBody(required = false) Map<String, Object> requestData) {
        ResponseEntity<Map<String, Object>> response = ehsController.listData(requestData);
        Map<String, Object> body = response.getBody();
        Object data = body == null ? null : body.get("data");

        if (!(data instanceof List<?> dataList)) {
            return response;
        }

        List<Object> result = new ArrayList<>();
        int notStarted = 0;
        int completed = 0;
        int inProgress = 0;

        for (Object rowObj : dataList) {
            if (!(rowObj instanceof Map<?, ?> row)) {
                continue;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("CheckCnt", row.get("CheckCnt"));
            item.put("CheckAreaCode", row.get("CheckAreaCode"));
            item.put("CheckAreaName", row.get("CheckAreaName"));

            Object templateList = row.get("TemplateList");
            int numberOfElevators = templateList instanceof List<?> templates ? templates.size() : 0;
            item.put("numberOfElevators", numberOfElevators);
            result.add(item);

            Object statusObj = row.get("Status");
            if (statusObj instanceof Number status) {
                int value = status.intValue();
                if (value == 0) {
                    notStarted++;
                } else if (value == 20) {
                    completed++;
                } else if (value == 10) {
                    inProgress++;
                }
            }
        }
        // int completeds = random.nextInt(41);
        Map<String, Object> summary = new HashMap<>();
        summary.put("notStarted", notStarted);
        summary.put("total", dataList.size());
        summary.put("completed", completed);
        summary.put("inProgress", inProgress);
        result.add(summary);

        return ResponseEntity.ok(Map.of(
                "code", 200,
                "msg", "success",
                "data", result
        ));
    }
}

