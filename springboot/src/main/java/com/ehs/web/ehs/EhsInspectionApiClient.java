package com.ehs.web.ehs;

import com.ehs.web.config.EhsProperties;
import com.ehs.web.http.EhsHttpClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class EhsInspectionApiClient {

    private final EhsHttpClient http;
    private final EhsProperties props;

    public EhsInspectionApiClient(EhsHttpClient http, EhsProperties props) {
        this.http = http;
        this.props = props;
    }

    public JsonNode getPatrolRoute(Map<String, String> commonParams) throws Exception {
        return http.get("/api/v2/HDCheckTask/GetPatrolRoute", commonParams);
    }

    public JsonNode getTemplateList(Map<String, String> commonParams) throws Exception {
        return http.get("/api/v2/HDCheckTask/GetTemplateList", commonParams);
    }

    public JsonNode getTemplateDetail(String tCode, String tRand, Map<String, String> commonParams) throws Exception {
        Map<String, String> p = new HashMap<>(commonParams);
        p.put("tCode", tCode);
        p.put("tRand", tRand);
        return http.get("/api/v2/HDCheckTaskDetail/GetHDTemplateDetail", p);
    }

    public JsonNode getHiddenDangerArea(String checkAreaType, Map<String, String> commonParams) throws Exception {
        Map<String, String> p = new HashMap<>(commonParams);
        p.put("checkAreaType", checkAreaType);
        return http.get("/api/v2/HDCheckTask/GetHiddenDangerArea", p);
    }

    public JsonNode saveCheckTaskTemplate(List<Map<String, Object>> templateData) throws Exception {
        Map<String, String> q = new HashMap<>();
        q.put("saveOp", "2");
        q.put("currentCompanyCode", props.getCheckTask().getCompanyCode());
        return http.post("/api/v2/HDCheckTaskDetail/SaveCheckTaskTemplateDetails", templateData, q);
    }
}
