package com.ehs.web.service;

import com.ehs.web.config.EhsProperties;
import com.ehs.web.http.EhsHttpClient;
import com.ehs.web.support.DataPaths;
import com.ehs.web.support.JsonFileUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * 对应 Python utils/reqable_code_data.py 中 CommonMessageMain / transform 等逻辑。
 */
@Service
public class CommonMessageDataService {

    private final EhsHttpClient http;
    private final DataPaths paths;
    private final JsonFileUtil jsonFileUtil;
    private final ObjectMapper objectMapper;
    private final EhsProperties props;

    public CommonMessageDataService(EhsHttpClient http, DataPaths paths, JsonFileUtil jsonFileUtil,
                                    ObjectMapper objectMapper, EhsProperties props) {
        this.http = http;
        this.paths = paths;
        this.jsonFileUtil = jsonFileUtil;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    public List<Map<String, Object>> commonMessageMain(int state, Consumer<String> log) throws Exception {
        jsonFileUtil.mergeJsonFilesInDirectory(paths.json("json", "date"), paths.json("json", "merged", "merged.json"));

        JsonNode patrolWrapper;
        if (state == 1) {
            patrolWrapper = readCommonMessageFile(log);
        } else if (state == 2) {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode dataArr = objectMapper.createArrayNode();
            ObjectNode row = objectMapper.createObjectNode();
            row.put("CreateDate", "2026-03-01 08:30:00");
            row.put("RecordCode", "CT260228000014");
            row.put("RecordID", 24492);
            dataArr.add(row);
            ObjectNode data = objectMapper.createObjectNode();
            data.set("Data", dataArr);
            root.set("data", data);
            patrolWrapper = root;
        } else {
            patrolWrapper = requestCommonCodeMain(log);
        }

        JsonNode recordCodeData = patrolWrapper.path("data").path("Data");
        if (!recordCodeData.isArray() || recordCodeData.isEmpty()) {
            throw new IllegalStateException("没有获取到巡检路线列表");
        }
        commonCodeType(recordCodeData, log);
        String ctCode = recordCodeData.get(0).get("RecordCode").asText();
        return requestDetailData(ctCode, log);
    }

    /** 对应 reqable_code_main：state==1 仅读本地，否则拉取接口 */
    public String resolveRecordCodeForPatrol(int state, Consumer<String> log) throws Exception {
        JsonNode patrolWrapper = state == 1 ? readCommonMessageFile(log) : requestCommonCodeMain(log);
        JsonNode recordCodeData = patrolWrapper.path("data").path("Data");
        if (!recordCodeData.isArray() || recordCodeData.isEmpty()) {
            throw new IllegalStateException("没有获取到 RecordCode");
        }
        return recordCodeData.get(0).get("RecordCode").asText();
    }

    private JsonNode readCommonMessageFile(Consumer<String> log) throws IOException {
        Path f = paths.json("json", "ehp", "CommonMessageMain.json");
        if (!Files.exists(f)) {
            throw new IOException("缺少文件: " + f);
        }
        log.accept("[CommonMessage] 使用本地 CommonMessageMain.json");
        return jsonFileUtil.readTree(f);
    }

    private JsonNode requestCommonCodeMain(Consumer<String> log) throws Exception {
        if (checkIfToday(log)) {
            log.accept("[CommonMessage] 今日已存在记录，读取本地文件");
            return readCommonMessageFile(log);
        }
        Map<String, String> qp = new HashMap<>();
        qp.put("templateType", "T");
        qp.put("templateCode", "RentalTask");
        qp.put("templateModule", "Rental");
        qp.put("isMobile", "1");
        qp.put("page", "0");
        qp.put("limit", "20");
        qp.put("conditions", "");
        qp.put("dataType", "");
        JsonNode resp = http.get("/api/v2/CommonMessage/GetTemplateCodeToDoMessagePageData", qp);
        Path out = paths.json("json", "ehp", "CommonMessageMain.json");
        jsonFileUtil.write(out, resp);
        log.accept("[CommonMessage] 已拉取并保存 CommonMessageMain.json");
        return resp;
    }

    private boolean checkIfToday(Consumer<String> log) {
        Path f = paths.json("json", "ehp", "CommonMessageMain.json");
        if (!Files.exists(f)) {
            return false;
        }
        try {
            JsonNode data = jsonFileUtil.readTree(f);
            String createDate = data.path("data").path("Data").path(0).path("CreateDate").asText(null);
            if (createDate == null) {
                return false;
            }
            LocalDateTime t = LocalDateTime.parse(createDate, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            LocalDate today = LocalDate.now();
            boolean same = t.toLocalDate().equals(today);
            log.accept("[CommonMessage] 本地记录日期检查: " + createDate + " -> 今日=" + same);
            return same;
        } catch (Exception e) {
            log.accept("[CommonMessage] 日期检查失败: " + e.getMessage());
            return false;
        }
    }

    private void commonCodeType(JsonNode recordCodeData, Consumer<String> log) throws IOException {
        if (!recordCodeData.isArray() || recordCodeData.isEmpty()) {
            return;
        }
        JsonNode row = recordCodeData.get(0);
        long id = row.path("RecordID").asLong();
        String recordCode = row.path("RecordCode").asText();
        if (id == 0 || recordCode == null || recordCode.isBlank()) {
            log.accept("[CommonCodeType] 缺少 RecordID 或 RecordCode");
            return;
        }
        String today = LocalDate.now().toString();
        Path file = paths.json("json", "date", "RecordCode_" + today + ".json");
        Files.createDirectories(file.getParent());

        List<Map<String, Object>> existing = new ArrayList<>();
        if (Files.exists(file)) {
            existing = objectMapper.readValue(file.toFile(),
                    new com.fasterxml.jackson.core.type.TypeReference<>() {
                    });
        }
        Map<String, Object> obj = new HashMap<>();
        obj.put("now", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        obj.put("id", id);
        obj.put("RecordCode", recordCode);
        obj.put("url", "https://ehs.sispark.com.cn:8443/mobile/#/pages/danger/checkTask/patrolRouteList?ctCode="
                + recordCode + "&id=" + id);
        obj.put("listurl", props.getBaseUrl().replaceAll("/$", "")
                + "/api/v2/HDCheckTask/GetApiPageData?ctCode=" + recordCode
                + "&currStatus=do&page=0&limit=20&conditions=&dataType=PatrolRouteList");
        existing.add(obj);
        jsonFileUtil.write(file, existing);
        log.accept("[CommonCodeType] 已写入 " + file);
    }

    private List<Map<String, Object>> requestDetailData(String ctCode, Consumer<String> log) throws Exception {
        Map<String, String> qp = Map.of("ctCode", ctCode);
        JsonNode responseData = http.get("/api/v2/HDCheckTask/GetDetailByCode", qp);
        Path listFile = paths.json("json", "ehp", "CommonMessageList.json");
        jsonFileUtil.write(listFile, responseData);

        JsonNode patrolRouteList = responseData.path("data").path("PatrolRouteList");
        if (!patrolRouteList.isArray()) {
            log.accept("[Detail] PatrolRouteList 不是数组");
            return List.of();
        }
        List<JsonNode> list = new ArrayList<>();
        for (JsonNode node : patrolRouteList) {
            list.add(node);
        }

        return commonMessageDetail(patrolRouteList, log);
    }

    private List<Map<String, Object>> commonMessageDetail(JsonNode rawData, Consumer<String> log) throws IOException {
        if (rawData == null || !rawData.isArray()) {
            log.accept("[Detail] 无有效 PatrolRouteList");
            return List.of();
        }
        List<Map<String, Object>> transformed = transformCheckData(rawData);
        Path out = paths.json("json", "ehp", "transformed_data.json");
        jsonFileUtil.write(out, transformed);
        log.accept("[Detail] 已保存 transformed_data.json，条数=" + transformed.size());
        return transformed;
    }

    private List<Map<String, Object>> transformCheckData(JsonNode data) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (JsonNode item : data) {
            String checkAreaName = item.path("CheckAreaName").asText("");
            Map<String, Object> base = new HashMap<>();
            base.put("CheckAreaType", text(item, "CheckAreaType"));
            base.put("CheckAreaCode", text(item, "CheckAreaCode"));
            base.put("CheckAreaName", checkAreaName);
            base.put("CheckCnt", nodeOrNull(item, "CheckCnt"));

            if (item.path("CheckCnt").isMissingNode() || item.path("CheckCnt").isNull() || "".equals(item.path("CheckCnt").asText(""))) {
                if (checkAreaName.contains("A1")) {
                    base.put("CheckResult", "NA");
                } else if (checkAreaName.contains("综合二1楼北客梯")) {
                    base.put("CheckResult", "NA");
                } else if (checkAreaName.contains("综合二1楼南客梯")) {
                    base.put("CheckResult", "NA");
                } else if (checkAreaName.contains("扶梯")) {
                    base.put("CheckResult", "NA");
                } else {
                    base.put("CheckResult", "Y");
                }
            }

            JsonNode templateList = item.path("TemplateList");
            if (!templateList.isArray() || templateList.isEmpty()) {
                continue;
            }
            int checkList = templateList.size();
            for (JsonNode template : templateList) {
                Map<String, Object> row = new HashMap<>(base);
                row.put("TCode", text(template, "TCode"));
                row.put("ObjectCode", text(template, "ObjectCode"));
                row.put("TRand", text(template, "TRand"));
                row.put("CTCode", text(template, "CTCode"));
                row.put("CheckList", checkList);
                out.add(row);
            }
        }
        return out;
    }

    private static Object nodeOrNull(JsonNode item, String field) {
        JsonNode n = item.get(field);
        if (n == null || n.isNull()) {
            return null;
        }
        if (n.isNumber()) {
            return n.numberValue();
        }
        return n.asText();
    }

    private static String text(JsonNode item, String field) {
        JsonNode n = item.get(field);
        return n == null || n.isNull() ? "" : n.asText();
    }
}
