package com.ehs.web.service;

import com.ehs.web.config.EhsProperties;
import com.ehs.web.http.EhsHttpClient;
import com.ehs.web.support.DataPaths;
import com.ehs.web.support.JsonFileUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * 对应 sumbitTwo / sumbitThree 中 PatrolRouteProcessor 与主流程（结束单条路由、结束整单）。
 */
@Service
public class PatrolRouteTaskService {

    private final EhsHttpClient http;
    private final DataPaths paths;
    private final JsonFileUtil jsonFileUtil;
    private final ObjectMapper objectMapper;
    private final EhsProperties props;
    private final CommonMessageDataService commonMessageDataService;

    public PatrolRouteTaskService(EhsHttpClient http, DataPaths paths, JsonFileUtil jsonFileUtil,
                                  ObjectMapper objectMapper, EhsProperties props,
                                  CommonMessageDataService commonMessageDataService) {
        this.http = http;
        this.paths = paths;
        this.jsonFileUtil = jsonFileUtil;
        this.objectMapper = objectMapper;
        this.props = props;
        this.commonMessageDataService = commonMessageDataService;
    }

    public void runSubmitWorkflow(int state, Consumer<String> log) throws Exception {
        String ctCode = commonMessageDataService.resolveRecordCodeForPatrol(state, log);
        log.accept("[Submit] ctCode=" + ctCode);

        JsonNode detailResponse = http.get("/api/v2/HDCheckTask/GetDetailByCode", Map.of("ctCode", ctCode));
        jsonFileUtil.write(paths.json("ehp", "detailCode.json"), detailResponse);

        JsonNode data = detailResponse.path("data");
        jsonFileUtil.write(paths.json("ehp", "detailCodeEnd.json"), data);

        JsonNode patrolRouteList = data.path("PatrolRouteList");
        if (!patrolRouteList.isArray() || patrolRouteList.isEmpty()) {
            log.accept("[Submit] 无巡检路由，结束");
            return;
        }

        jsonFileUtil.write(paths.json("ehp", "patrolRouteList.json"), patrolRouteList);

        int total = patrolRouteList.size();
        int idx = 0;
        for (JsonNode item : patrolRouteList) {
            idx++;
            processSingleRoute(item, ctCode, idx, total, log);
        }

        int endDelay = props.getDelay().getDefaultDelayEndSeconds();
        LocalDate today = LocalDate.now();
        if (today.getDayOfWeek().getValue() >= 6) {
            endDelay = Math.max((int) (endDelay * (2.0 / 3)), 60);
            log.accept("[Submit] 周末，结束前等待调整为 " + endDelay + " 秒");
        } else {
            log.accept("[Submit] 结束前等待 " + endDelay + " 秒");
        }
        sleepSeconds(endDelay, log, "等待结束任务");

        JsonNode endPayload = jsonFileUtil.readTree(paths.json("ehp", "detailCodeEnd.json"));
        if (!endPayload.isObject()) {
            throw new IllegalStateException("detailCodeEnd.json 无效");
        }
        Map<String, String> q = Map.of("currentCompanyCode", props.getCheckTask().getCompanyCode());
        JsonNode endResp = http.post("/api/v2/HDCheckTask/End", objectMapper.convertValue(endPayload, Map.class), q);
        log.accept("[Submit] End 任务响应: " + endResp.toString().substring(0, Math.min(200, endResp.toString().length())));
        updateCommonMessageStatus(log);
    }

    private void processSingleRoute(JsonNode item, String ctCode, int index, int total, Consumer<String> log) throws Exception {
        String areaName = item.path("CheckAreaName").asText("未知区域");
        String checkAreaCode = item.path("CheckAreaCode").asText("");
        if (checkAreaCode.isBlank()) {
            log.accept("[Submit] [" + index + "/" + total + "] 跳过（无 CheckAreaCode）: " + areaName);
            return;
        }
        log.accept("[Submit] [" + index + "/" + total + "] 处理: " + areaName);

        Map<String, String> qp = new HashMap<>();
        qp.put("ctCode", ctCode);
        qp.put("checkAreaCode", checkAreaCode);
        http.get("/api/v2/HDCheckTask/GetTemplateList", qp);
        sleepSeconds(props.getDelay().getShortDelaySeconds(), log, "短等待");

        JsonNode patrolData = http.get("/api/v2/HDCheckTask/GetPatrolRoute", qp);
        JsonNode inner = patrolData.path("data");
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.convertValue(inner, Map.class);
        Map<String, String> endQ = Map.of("currentCompanyCode", props.getCheckTask().getCompanyCode());
        JsonNode endRoute = http.post("/api/v2/HDCheckTask/EndPatrolRoute", payload, endQ);

        int delay;
        if (endRoute.path("code").asInt(0) == -1) {
            delay = props.getDelay().getErrorDelaySeconds();
            log.accept("[Submit] EndPatrolRoute code=-1，等待 " + delay + " 秒");
        } else {
            delay = props.getDelay().getDefaultDelaySeconds();
        }
        sleepSeconds(delay, log, "区段等待");

        http.get("/api/v2/HDCheckTask/GetApiPageData", Map.of(
                "ctCode", ctCode,
                "currStatus", "do",
                "page", "0",
                "limit", "20",
                "conditions", "",
                "dataType", "PatrolRouteList"
        ));
        log.accept("[Submit] [" + index + "/" + total + "] 完成: " + areaName);
    }

    private void sleepSeconds(int seconds, Consumer<String> log, String label) throws InterruptedException {
        for (int i = 0; i < seconds; i++) {
            Thread.sleep(1000);
            if (i == 0 || (i + 1) % 10 == 0 || i == seconds - 1) {
                log.accept("[" + label + "] " + (i + 1) + "/" + seconds + " 秒");
            }
        }
    }

    private void updateCommonMessageStatus(Consumer<String> log) {
        try {
            java.nio.file.Path statusFile = paths.json("json", "ehp", "CommonMessageMain.json");
            if (!Files.exists(statusFile)) {
                log.accept("[Submit] 状态文件不存在，跳过 CommonMessageMain 更新");
                return;
            }
            JsonNode root = jsonFileUtil.readTree(statusFile);
            if (root.isObject()) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) root).put("ehsStatus", false);
                jsonFileUtil.write(statusFile, root);
                log.accept("[Submit] 已更新 CommonMessageMain.json ehsStatus=false");
            }
        } catch (Exception e) {
            log.accept("[Submit] 更新状态失败: " + e.getMessage());
        }
    }
}
