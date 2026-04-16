package com.ehs.web.service;

import com.ehs.web.config.EhsProperties;
import com.ehs.web.http.EhsHttpClient;
import com.ehs.web.support.DataPaths;
import com.ehs.web.support.JsonFileUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.function.Consumer;

/**
 * 巡检周期服务 - 对应 appTwo / appThree 流程
 */
@Service
public class InspectionCycleService {

    private final EhsHttpClient http;
    private final DataPaths paths;
    private final JsonFileUtil jsonFileUtil;
    private final ObjectMapper objectMapper;
    private final EhsProperties props;
    private final CommonMessageDataService commonMessageDataService;

    public InspectionCycleService(EhsHttpClient http, DataPaths paths, JsonFileUtil jsonFileUtil,
                                  ObjectMapper objectMapper, EhsProperties props,
                                  CommonMessageDataService commonMessageDataService) {
        this.http = http;
        this.paths = paths;
        this.jsonFileUtil = jsonFileUtil;
        this.objectMapper = objectMapper;
        this.props = props;
        this.commonMessageDataService = commonMessageDataService;
    }

    /**
     * 运行 AppTwo 周期
     */
    public void runAppTwoCycle(int state, Consumer<String> log) throws Exception {
        log.accept("[AppTwo] 开始执行巡检周期");
        commonMessageDataService.commonMessageMain(state, log);
        log.accept("[AppTwo] 巡检周期执行完成");
    }

    /**
     * 运行 AppThree 周期
     */
    public void runAppThreeCycle(int state, Consumer<String> log) throws Exception {
        log.accept("[AppThree] 开始执行巡检周期");
        commonMessageDataService.commonMessageMain(state, log);
        log.accept("[AppThree] 巡检周期执行完成");
    }
}
