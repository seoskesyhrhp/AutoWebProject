package com.ehs.web.http;

import com.ehs.web.config.EhsProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.net.URIBuilder;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Map;

/**
 * EHS HTTP 客户端封装
 */
@Component
public class EhsHttpClient {

    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final EhsProperties props;

    public EhsHttpClient(ObjectMapper objectMapper, EhsProperties props) {
        this.httpClient = HttpClients.createDefault();
        this.objectMapper = objectMapper;
        this.props = props;
    }

    /**
     * GET 请求
     */
    public JsonNode get(String path, Map<String, String> queryParams) throws Exception {
        URIBuilder uriBuilder = new URIBuilder(props.getBaseUrl() + path);
        if (queryParams != null) {
            queryParams.forEach(uriBuilder::addParameter);
        }
        URI uri = uriBuilder.build();

        HttpGet httpGet = new HttpGet(uri);
        httpGet.addHeader("Authorization", "Bearer " + props.getSessionToken());
        httpGet.addHeader("Accept", "application/json");

        try (CloseableHttpResponse response = httpClient.execute(httpGet)) {
            String body = EntityUtils.toString(response.getEntity());
            return objectMapper.readTree(body);
        }
    }

    /**
     * POST 请求
     */
    public JsonNode post(String path, Object payload, Map<String, String> queryParams) throws Exception {
        URIBuilder uriBuilder = new URIBuilder(props.getBaseUrl() + path);
        if (queryParams != null) {
            queryParams.forEach(uriBuilder::addParameter);
        }
        URI uri = uriBuilder.build();

        HttpPost httpPost = new HttpPost(uri);
        httpPost.addHeader("Authorization", "Bearer " + props.getSessionToken());
        httpPost.addHeader("Content-Type", "application/json");
        httpPost.addHeader("Accept", "application/json");

        String jsonBody = objectMapper.writeValueAsString(payload);
        httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
            String body = EntityUtils.toString(response.getEntity());
            return objectMapper.readTree(body);
        }
    }
}
