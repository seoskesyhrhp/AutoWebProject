package com.ehs.web.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ehs")
public class EhsProperties {

    private String baseUrl = "https://ehs.sispark.com.cn:8443";
    private String sessionToken = "";
    private int requestTimeoutMs = 30000;
    private String dataRoot = "data";
    private String adminConfigPath = "data/json/ehsConfig.json";
    private CheckTask checkTask = new CheckTask();
    private Delay delay = new Delay();

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public int getRequestTimeoutMs() {
        return requestTimeoutMs;
    }

    public void setRequestTimeoutMs(int requestTimeoutMs) {
        this.requestTimeoutMs = requestTimeoutMs;
    }

    public String getDataRoot() {
        return dataRoot;
    }

    public void setDataRoot(String dataRoot) {
        this.dataRoot = dataRoot;
    }

    public String getAdminConfigPath() {
        return adminConfigPath;
    }

    public void setAdminConfigPath(String adminConfigPath) {
        this.adminConfigPath = adminConfigPath;
    }

    public CheckTask getCheckTask() {
        return checkTask;
    }

    public void setCheckTask(CheckTask checkTask) {
        this.checkTask = checkTask;
    }

    public Delay getDelay() {
        return delay;
    }

    public void setDelay(Delay delay) {
        this.delay = delay;
    }

    public static class CheckTask {
        private String checkTaskName = "";
        private String checkNames = "";
        private int checkTaskId = 17554;
        private String companyCode = "P0002";

        public String getCheckTaskName() {
            return checkTaskName;
        }

        public void setCheckTaskName(String checkTaskName) {
            this.checkTaskName = checkTaskName;
        }

        public String getCheckNames() {
            return checkNames;
        }

        public void setCheckNames(String checkNames) {
            this.checkNames = checkNames;
        }

        public int getCheckTaskId() {
            return checkTaskId;
        }

        public void setCheckTaskId(int checkTaskId) {
            this.checkTaskId = checkTaskId;
        }

        public String getCompanyCode() {
            return companyCode;
        }

        public void setCompanyCode(String companyCode) {
            this.companyCode = companyCode;
        }
    }

    public static class Delay {
        private int shortDelaySeconds = 1;
        private int defaultDelaySeconds = 4;
        private int defaultDelayEndSeconds = 60;
        private int errorDelaySeconds = 1;
        private int longDelayMinSeconds = 90;
        private int longDelayMaxSeconds = 130;

        public int getShortDelaySeconds() {
            return shortDelaySeconds;
        }

        public void setShortDelaySeconds(int shortDelaySeconds) {
            this.shortDelaySeconds = shortDelaySeconds;
        }

        public int getDefaultDelaySeconds() {
            return defaultDelaySeconds;
        }

        public void setDefaultDelaySeconds(int defaultDelaySeconds) {
            this.defaultDelaySeconds = defaultDelaySeconds;
        }

        public int getDefaultDelayEndSeconds() {
            return defaultDelayEndSeconds;
        }

        public void setDefaultDelayEndSeconds(int defaultDelayEndSeconds) {
            this.defaultDelayEndSeconds = defaultDelayEndSeconds;
        }

        public int getErrorDelaySeconds() {
            return errorDelaySeconds;
        }

        public void setErrorDelaySeconds(int errorDelaySeconds) {
            this.errorDelaySeconds = errorDelaySeconds;
        }

        public int getLongDelayMinSeconds() {
            return longDelayMinSeconds;
        }

        public void setLongDelayMinSeconds(int longDelayMinSeconds) {
            this.longDelayMinSeconds = longDelayMinSeconds;
        }

        public int getLongDelayMaxSeconds() {
            return longDelayMaxSeconds;
        }

        public void setLongDelayMaxSeconds(int longDelayMaxSeconds) {
            this.longDelayMaxSeconds = longDelayMaxSeconds;
        }
    }
}
