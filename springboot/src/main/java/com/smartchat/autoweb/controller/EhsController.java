package com.smartchat.autoweb.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.smartchat.autoweb.utils.EHSPhotoManager;
import com.smartchat.autoweb.utils.HDCheckTaskService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.LinkedHashSet;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.util.Iterator;

@RestController
@RequestMapping("/ehs")
public class EhsController {
    private static final Logger logger = LoggerFactory.getLogger(EhsController.class);

    private static final String BASE_URL = "https://ehs.sispark.com.cn:8443/api/v2/HDCheckTask/GetDetailByCode";
    private static final String COOKIE = ".AspNetCore.Session=ZDI2NTIxZTQtZmM1MS00NDgzLTEwZWQtZjgyZDFiMTAzYmRl";
    private static final String USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.project-root:../}")
    private String projectRoot;

    @Value("${app.skip-night-time-check:false}")
    private boolean skipNightTimeCheck;

    private final ObjectMapper objectMapper;
    private final HDCheckTaskService hdCheckTaskService;

    public EhsController(ObjectMapper objectMapper, HDCheckTaskService hdCheckTaskService) {
        this.objectMapper = objectMapper;
        this.hdCheckTaskService = hdCheckTaskService;
    }

    @GetMapping("/status/")
    public ResponseEntity<Map<String, Object>> readStatus() {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", readConfigIni(),
                    "message", "成功读取配置"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "data", Map.of(),
                    "message", "读取配置失败"
            ));
        }
    }

    @GetMapping("/status/{id}")
    public ResponseEntity<Map<String, Object>> statusAction(@PathVariable String id) {
        String normalized = id == null ? "" : id.toLowerCase();
        try {
            return switch (normalized) {
                case "y", "n" -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "data", updateConfigIni(normalized),
                        "message", "y".equals(normalized) ? "成功更新配置为启用状态" : "成功更新配置为禁用状态"
                ));
                case "init" -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "data", initConfigIni(),
                        "message", "成功初始化配置"
                ));
                case "help" -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "data", helpConfigIni(),
                        "message", "帮助文档"
                ));
                default -> ResponseEntity.ok(Map.of(
                        "success", false,
                        "data", Map.of(),
                        "message", "不支持的操作类型: " + normalized + "，支持的操作: y, n, init, help"
                ));
            };
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "data", Map.of(),
                    "message", "服务器内部错误，请稍后重试"
            ));
        }
    }

    /**
     * 与 FastAPI {@code GET/POST /ehs/disable/} 对齐：写入 {@code json/ehsConfig.json} 的 {@code ehsStatus=false}。
     */
    @RequestMapping(value = {"/disable", "/disable/"}, method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> disableEhs() {
        try {
            updateEhsConfigJsonStatus(false);
            return ResponseEntity.ok(buildEhsToggleResponse(
                    200, "禁用", "系统自动结束巡检任务设置成功!", "/disable", null));
        } catch (Exception e) {
            logger.warn("更新 ehsConfig 失败(disable): {}", e.getMessage());
            return ResponseEntity.ok(buildEhsToggleResponse(
                    500, "禁用", "系统自动结束巡检任务设置失败!", "/disable", e.getMessage()));
        }
    }

    /**
     * 与 FastAPI {@code GET/POST /ehs/enable/} 对齐：{@code ehsStatus=true}。
     */
    @RequestMapping(value = {"/enable", "/enable/"}, method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> enableEhsJson() {
        try {
            updateEhsConfigJsonStatus(true);
            return ResponseEntity.ok(buildEhsToggleResponse(
                    200, "启用", "系统取消自动结束巡检任务成功!", "/enable", null));
        } catch (Exception e) {
            logger.warn("更新 ehsConfig 失败(enable): {}", e.getMessage());
            return ResponseEntity.ok(buildEhsToggleResponse(
                    500, "启用", "系统取消自动结束巡检任务失败!", "/enable", e.getMessage()));
        }
    }

    @PostMapping("/obtainInspectionData")
    public ResponseEntity<Map<String, Object>> obtainInspectionData() {
        try {
            Path file = Path.of(projectRoot, "json", "ehp", "CommonMessageList.json");
            Map<?, ?> root = objectMapper.readValue(file.toFile(), Map.class);
            Object patrolRouteList = List.of();
            Object dataObj = root.get("data");
            if (dataObj instanceof Map<?, ?> dataMap && dataMap.containsKey("PatrolRouteList")) {
                patrolRouteList = dataMap.get("PatrolRouteList");
            }
            return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", patrolRouteList));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("code", 500, "msg", "error", "data", Map.of("err", e.getMessage())));
        }
    }

    @PostMapping("/main/")
    public ResponseEntity<Map<String, Object>> mainData() {
        try {
            // 获取绝对路径
            logger.info(System.getProperty("user.dir"));
            logger.info("Requesting main data... ->" + projectRoot + "json/" + "ehp/" + "CommonMessageMain.json");
            Path file = Path.of(projectRoot, "json", "ehp", "CommonMessageMain.json");
            Object data = objectMapper.readValue(file.toFile(), Object.class);
            return ResponseEntity.ok(Map.of("code", 200, "msg", "local", "data", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "error",
                    "data", Map.of("err", e.getMessage())
            ));
        }
    }

    @PostMapping({"/list", "/list/"})
    public ResponseEntity<Map<String, Object>> listData(@RequestBody(required = false) Map<String, Object> requestData) {
        if (requestData == null) {
            requestData = Map.of();
        }
        Object ctCodeObj = requestData.get("ct_code");
        boolean enableTest = Boolean.TRUE.equals(requestData.get("enableTest"));
        if (enableTest) {
            return ResponseEntity.ok(successListResponse(readListFromLocalFile()));
        }
        String ctCode = ctCodeObj == null ? "" : String.valueOf(ctCodeObj).trim();
        if (ctCode.isBlank()) {
            return ResponseEntity.ok(Map.of(
                    "code", 400,
                    "msg", "参数错误",
                    "status", "error",
                    "message", "参数错误",
                    "data", requestData
            ));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Cookie", COOKIE);

            String url = BASE_URL + "?ctCode=" + ctCode;
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();

            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode patrolRouteListNode = rootNode.path("data").path("PatrolRouteList");
            List<Object> patrolRouteList = objectMapper.convertValue(patrolRouteListNode, List.class);
            writeListToLocalFile(rootNode);
            return ResponseEntity.ok(successListResponse(patrolRouteList));
        } catch (Exception e) {
            logger.warn("请求EHS明细失败，回退本地文件。ctCode={}, err={}", ctCode, e.getMessage());
            List<Object> localList = readListFromLocalFile();
            if (!localList.isEmpty()) {
                return ResponseEntity.ok(successListResponse(localList));
            }
            return ResponseEntity.ok(Map.of(
                    "code", 500,
                    "msg", "请求失败",
                    "status", "error",
                    "message", "请求失败",
                    "data", List.of(),
                    "err", e.getMessage()
            ));
        }
    }

    private Map<String, Object> successListResponse(List<Object> patrolRouteList) {
        return Map.of(
                "code", 200,
                "msg", "请求成功",
                "status", "success",
                "message", "请求成功",
                "data", patrolRouteList == null ? List.of() : patrolRouteList
        );
    }

    private Path getListCacheFilePath() {
        return Path.of(projectRoot, "json", "ehp", "CommonMessageList.json");
    }

    private void writeListToLocalFile(JsonNode rootNode) {
        try {
            Path cacheFile = getListCacheFilePath();
            Files.createDirectories(cacheFile.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(cacheFile.toFile(), rootNode);
        } catch (Exception e) {
            logger.warn("写入本地缓存失败: {}", e.getMessage());
        }
    }

    private List<Object> readListFromLocalFile() {
        try {
            File file = getListCacheFilePath().toFile();
            if (!file.exists()) {
                return new ArrayList<>();
            }
            JsonNode rootNode = objectMapper.readTree(file);
            JsonNode patrolRouteListNode = rootNode.path("data").path("PatrolRouteList");
            return objectMapper.convertValue(patrolRouteListNode, List.class);
        } catch (Exception e) {
            logger.warn("读取本地缓存失败: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @PostMapping("/getPictures/")
    public ResponseEntity<Map<String, Object>> getPictures(@RequestBody(required = false) Map<String, Object> body) {
        try {
            String checkAreaCode = body == null ? "" : String.valueOf(body.getOrDefault("check_area_code", ""));
            Path baseDir = Path.of(projectRoot, "static", "ehs", "ehsImgs").normalize();

            if (!Files.exists(baseDir) || !Files.isDirectory(baseDir)) {
                return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", List.of()));
            }

            if (checkAreaCode != null && !checkAreaCode.isBlank()) {
                Path target = baseDir.resolve(checkAreaCode).normalize();
                if (!target.startsWith(baseDir) || !Files.exists(target) || !Files.isDirectory(target)) {
                    return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", List.of()));
                }
                return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", buildPictureGroup(baseDir, target)));
            }

            List<Map<String, Object>> groups = new ArrayList<>();
            try (var dirStream = Files.list(baseDir)) {
                dirStream.filter(Files::isDirectory).forEach(dir -> {
                    Map<String, Object> group = buildPictureGroup(baseDir, dir);
                    groups.add(group);
                });
            }
            return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", groups));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "code", 500,
                    "msg", "error",
                    "data", Map.of("err", e.getMessage())
            ));
        }
    }

    @PostMapping("/SaveObjectPhotos/")
    public ResponseEntity<Map<String, Object>> saveObjectPhotos(
            @RequestParam("object_code") String objectCode,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (objectCode == null || objectCode.isBlank() || file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "参数错误或缺失"));
            }

            Path saveDir = Path.of(projectRoot, "static", "img");
            Files.createDirectories(saveDir);

            String originalName = file.getOriginalFilename() == null ? "upload.bin" : file.getOriginalFilename();
            String safeFilename = Paths.get(originalName).getFileName().toString();
            Path targetFile = saveDir.resolve(safeFilename).normalize();
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            Map<?, ?> parsedObjectCode = objectMapper.readValue(objectCode, Map.class);
            Object checkAreaCode = parsedObjectCode.get("CheckAreaCode");
            Object ctCode = parsedObjectCode.get("ct_code");
            if (checkAreaCode == null || ctCode == null) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "参数错误或缺失"));
            }

            if (isNightTime()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "code", 400,
                        "msg", "当前是夜间模式",
                        "data", Map.of(
                                "file_path", targetFile.toString(),
                                "obj", parsedObjectCode
                        )
                ));
            }

            String staticUrl = "/static/img/" + safeFilename;
            String finalFilePath = targetFile.toString();
            if (isImageFile(staticUrl)) {
                Path compressedPath = saveDir.resolve("compressed_" + safeFilename).normalize();
                if (compressImage(targetFile, compressedPath)) {
                    finalFilePath = compressedPath.toString();
                    logger.info("图片压缩成功: {} -> {}", targetFile, compressedPath);
                } else {
                    logger.warn("图片压缩失败，使用原图: {}", targetFile);
                }
            }

            Map<String, String> config = new HashMap<>();
            config.put("base_url", "https://ehs.sispark.com.cn:8443");
            config.put("cookie", COOKIE);
            config.put("ct_code", String.valueOf(ctCode));
            config.put("object_code", String.valueOf(checkAreaCode));
            config.put("file_path", finalFilePath);

            logger.info("config: {}", config);
            Map<String, Object> result = EHSPhotoManager.commonImgMain(config);
            logger.info("result: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "error",
                    "data", e.getMessage()
            ));
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> clearInspectionTaskPhotos(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = hdCheckTaskService.clearInspectionTaskPhotos(payload);
            if (result.get("data") != null) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("data", null, "message", "处理失败: " + e.getMessage())
            );
        }
    }

    @PostMapping("/SaveObjectPhotos/batch")
    public ResponseEntity<Map<String, Object>> saveObjectPhotosBatch(@RequestBody Map<String, Object> payload) {
        try {
            String ctCode = payload.getOrDefault("CtCode", "").toString();
            String objectCode = payload.getOrDefault("ObjectCode", "").toString();
            Object photoListObj = payload.get("PhotoList");

            if (ctCode.isBlank() || objectCode.isBlank() || photoListObj == null) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "参数错误或缺失"));
            }

            List<?> photoList = (List<?>) photoListObj;

            // 调用EHS接口保存图片
            String url = "https://ehs.sispark.com.cn:8443/api/v2/HDCheckTask/SaveObjectPhotos";
            HttpHeaders headers = new HttpHeaders();
            headers.set("Host", "ehs.sispark.com.cn:8443");
            headers.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Encoding", "gzip, deflate, br, zstd");
            headers.set("Content-Type", "application/json;charset=UTF-8");
            headers.set("sec-ch-ua-platform", "\"macOS\"");
            headers.set("Authorization", "Bearer NTJjNjE1MGMtMTcxYi1lNTkxLWZlOWEtZDkwMWI1ZDA5ZmU5");
            headers.set("Cache-Control", "no-cache, no-store");
            headers.set("Pragma", "no-cache");
            headers.set("sec-ch-ua", "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"");
            headers.set("sec-ch-ua-mobile", "?0");
            headers.set("token", "NTJjNjE1MGMtMTcxYi1lNTkxLWZlOWEtZDkwMWI1ZDA5ZmU5");
            headers.set("Origin", "https://ehs.sispark.com.cn:8443");
            headers.set("Sec-Fetch-Site", "same-origin");
            headers.set("Sec-Fetch-Mode", "cors");
            headers.set("Sec-Fetch-Dest", "empty");
            headers.set("Referer", "https://ehs.sispark.com.cn:8443/mobile/");
            headers.set("Accept-Language", "en,zh-CN;q=0.9,zh;q=0.8");
            headers.set("Cookie", ".AspNetCore.Session=NTJjNjE1MGMtMTcxYi1lNTkxLWZlOWEtZDkwMWI1ZDA5ZmU5");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("CtCode", ctCode);
            requestBody.put("ObjectCode", objectCode);
            requestBody.put("PhotoList", photoList);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String responseStr = restTemplate.postForObject(url, entity, String.class);
            logger.info("EHS Response: {}", responseStr);

            // 解析响应
            Map<String, Object> responseMap = objectMapper.readValue(responseStr, Map.class);
            Boolean success = Boolean.TRUE.equals(responseMap.get("success"));

            if (success) {
                return ResponseEntity.ok(Map.of(
                        "code", 200,
                        "msg", "success",
                        "data", Map.of(
                                "saved_count", photoList.size(),
                                "response", responseMap
                        )
                ));
            } else {
                logger.warn("EHS API returned failure: {}", responseMap);
                return ResponseEntity.ok(Map.of(
                        "code", 500,
                        "msg", "EHS接口返回失败",
                        "data", Map.of(
                                "saved_count", 0,
                                "response", responseMap
                        )
                ));
            }

        } catch (Exception e) {
            logger.error("批量保存图片到EHS失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "批量保存失败: " + e.getMessage(),
                    "data", e.getMessage()
            ));
        }
    }

    @RequestMapping(value = {"/json", "/json/"}, method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> getJson() {
        Path source = Path.of(projectRoot, "json", "merged", "merged.json");
        Path output = Path.of(projectRoot, "json", "merged", "merged_one.json");
        
        try {
            if (!Files.exists(source)) {
                logger.warn("Source file not found: {}", source);
                return ResponseEntity.ok(Map.of("code", 404, "msg", "File not found", "data", (Object) null));
            }

            // 读取并解析JSON数据
            List<?> rootList = objectMapper.readValue(source.toFile(), List.class);
            List<Map<String, Object>> flatList = flattenAndDeduplicateByRecordCode(rootList);
            
            // 按日期去重，保留每天最新的记录
            List<Map<String, Object>> uniqueData = deduplicateByDate(flatList);
            
            // 写入输出文件
            Files.createDirectories(output.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(output.toFile(), uniqueData);
            
            logger.info("Processed {} records, unique by date: {}", flatList.size(), uniqueData.size());
            return ResponseEntity.ok(Map.of("code", 200, "msg", "success", "data", uniqueData, "flatList", flatList));
            
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            logger.error("Invalid JSON format: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("code", 400, "msg", "Invalid JSON format", "data", (Object) null));
        } catch (Exception e) {
            logger.error("Error processing JSON: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("code", 500, "msg", "Internal server error", "data", e.getMessage()));
        }
    }
    
    /**
     * 扁平化列表并按RecordCode去重
     */
    private List<Map<String, Object>> flattenAndDeduplicateByRecordCode(List<?> rootList) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Object groupObj : rootList) {
            if (!(groupObj instanceof List<?> groupList)) continue;
            
            Set<String> seen = new LinkedHashSet<>();
            for (Object itemObj : groupList) {
                if (!(itemObj instanceof Map<?, ?> rawMap)) continue;
                
                Map<String, Object> item = convertToStringKeyMap(rawMap);
                String recordCode = (String) item.get("RecordCode");
                
                if (recordCode != null && !seen.contains(recordCode)) {
                    seen.add(recordCode);
                    result.add(item);
                }
            }
        }
        return result;
    }
    
    /**
     * 按日期去重，保留每天时间最新的记录
     */
    private List<Map<String, Object>> deduplicateByDate(List<Map<String, Object>> list) {
        return list.stream()
            .filter(item -> item.get("now") != null)
            .collect(Collectors.toMap(
                item -> extractDate(item.get("now").toString()),
                item -> item,
                (existing, newItem) -> {
                    String existingTime = (String) existing.get("now");
                    String newTime = (String) newItem.get("now");
                    return newTime.compareTo(existingTime) > 0 ? newItem : existing;
                },
                LinkedHashMap::new
            ))
            .values()
            .stream()
            .sorted(Comparator.comparing(item -> (String) item.get("now")))
            .collect(Collectors.toList());
    }
    
    /**
     * 提取日期部分 (yyyy-MM-dd)
     */
    private String extractDate(String dateTime) {
        if (dateTime == null || dateTime.length() < 10) return "";
        return dateTime.substring(0, 10);
    }
    
    /**
     * 将Map的键转换为String类型
     */
    private Map<String, Object> convertToStringKeyMap(Map<?, ?> rawMap) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            result.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return result;
    }

    @GetMapping({"/files/{checkAreaCode}", "/files/{checkAreaCode}/"})
    public ResponseEntity<Map<String, Object>> listFiles(@PathVariable("checkAreaCode") String checkAreaCode) {
        try {
            Path targetDir = Path.of(projectRoot, "static", "ehs", "ehsImgs", checkAreaCode).normalize();
            if (!Files.exists(targetDir) || !Files.isDirectory(targetDir)) {
                return ResponseEntity.ok(Map.of(
                        "code", 404,
                        "msg", "目录不存在",
                        "timestamp", LocalDateTime.now().toString()
                ));
            }

            List<Map<String, Object>> files = new ArrayList<>();
            long[] totalSize = {0L};
            try (var stream = Files.list(targetDir)) {
                stream.filter(Files::isRegularFile)
                        .sorted((a, b) -> {
                            try {
                                return Files.getLastModifiedTime(b).compareTo(Files.getLastModifiedTime(a));
                            } catch (IOException e) {
                                return Comparator.comparing(Path::getFileName).compare(a, b);
                            }
                        })
                        .forEach(path -> {
                            try {
                                long size = Files.size(path);
                                totalSize[0] += size;
                                String modifiedTime = LocalDateTime.ofInstant(
                                        Files.getLastModifiedTime(path).toInstant(), ZoneId.systemDefault()
                                ).toString();
                                String createdTime = LocalDateTime.ofInstant(
                                        ((java.nio.file.attribute.FileTime) Files.getAttribute(path, "creationTime")).toInstant(),
                                        ZoneId.systemDefault()
                                ).toString();
                                String filename = path.getFileName().toString();
                                Map<String, Object> fileInfo = new HashMap<>();
                                fileInfo.put("name", filename);
                                fileInfo.put("path", checkAreaCode + "/" + filename);
                                fileInfo.put("size", size);
                                fileInfo.put("modified_time", modifiedTime);
                                fileInfo.put("created_time", createdTime);
                                fileInfo.put("is_image", isImageFile(filename));
                                files.add(fileInfo);
                            } catch (IOException ignored) {
                                // Skip unreadable file, keep response available.
                            }
                        });
            }

            return ResponseEntity.ok(Map.of(
                    "code", 200,
                    "msg", "获取成功",
                    "timestamp", LocalDateTime.now().toString(),
                    "data", Map.of(
                            "files", files,
                            "total_count", files.size(),
                            "total_size", totalSize[0],
                            "check_area_code", checkAreaCode
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "获取失败",
                    "timestamp", LocalDateTime.now().toString()
            ));
        }
    }

    @DeleteMapping({"/files/{checkAreaCode}/{filename}", "/files/{checkAreaCode}/{filename}/"})
    public ResponseEntity<Map<String, Object>> deleteFile(
            @PathVariable("checkAreaCode") String checkAreaCode,
            @PathVariable("filename") String filename
    ) {
        try {
            String decodedFilename = URLDecoder.decode(filename, StandardCharsets.UTF_8);
            Path baseDir = Path.of(projectRoot, "static", "ehs", "ehsImgs", checkAreaCode).normalize();
            Path targetFile = baseDir.resolve(Paths.get(decodedFilename).getFileName().toString()).normalize();

            if (!targetFile.startsWith(baseDir)) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "非法文件路径"));
            }

            if (!Files.exists(targetFile) || !Files.isRegularFile(targetFile)) {
                return ResponseEntity.ok(Map.of("code", 404, "msg", "文件不存在"));
            }

            Files.delete(targetFile);
            return ResponseEntity.ok(Map.of(
                    "code", 200,
                    "msg", "success",
                    "data", Map.of(
                            "check_area_code", checkAreaCode,
                            "filename", decodedFilename
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "error",
                    "data", Map.of("err", e.getMessage())
            ));
        }
    }

    @PostMapping({"/upload", "/upload/"})
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("check_area_code") String checkAreaCode,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (checkAreaCode == null || checkAreaCode.isBlank() || file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "参数错误或缺失"));
            }

            Path baseDir = Path.of(projectRoot, "static", "ehs", "ehsImgs", checkAreaCode).normalize();
            Files.createDirectories(baseDir);

            String originalName = file.getOriginalFilename() == null ? "upload.bin" : file.getOriginalFilename();
            String safeFilename = Paths.get(originalName).getFileName().toString();
            Path targetFile = baseDir.resolve(safeFilename).normalize();

            if (!targetFile.startsWith(baseDir)) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "msg", "文件名不安全"));
            }

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok(Map.of(
                    "code", 200,
                    "msg", "success",
                    "data", Map.of(
                            "check_area_code", checkAreaCode,
                            "filename", safeFilename,
                            "path", checkAreaCode + "/" + safeFilename,
                            "size", Files.size(targetFile)
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", 500,
                    "msg", "error",
                    "data", Map.of("err", e.getMessage())
            ));
        }
    }

    private boolean isImageFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".png")
                || lower.endsWith(".gif")
                || lower.endsWith(".bmp")
                || lower.endsWith(".webp")
                || lower.endsWith(".tiff");
    }

    private boolean isNightTime() {
        if (skipNightTimeCheck) {
            return false;
        }
        LocalTime now = LocalTime.now();
        LocalTime startNight = LocalTime.of(20, 00);
        LocalTime endMorning = LocalTime.of(8, 0);
        return !now.isBefore(startNight) || now.isBefore(endMorning);
    }

    private Path getEhsConfigJsonPath() {
        return Path.of(projectRoot, "json", "ehsConfig.json");
    }

    private Map<String, Object> readEhsConfigJson() throws IOException {
        Path path = getEhsConfigJsonPath();
        if (!Files.exists(path)) {
            Map<String, Object> defaults = new LinkedHashMap<>();
            defaults.put("ehsStatus", false);
            defaults.put("adminVerif", "n");
            return defaults;
        }
        return objectMapper.readValue(path.toFile(), new TypeReference<Map<String, Object>>() {});
    }

    private void updateEhsConfigJsonStatus(boolean ehsStatus) throws IOException {
        Path path = getEhsConfigJsonPath();
        Map<String, Object> data = readEhsConfigJson();
        data.put("ehsStatus", ehsStatus);
        Files.createDirectories(path.getParent());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), data);
    }

    private Map<String, Object> buildEhsToggleResponse(int code, String title, String content, String link, String err) {
        Map<String, Object> objData;
        try {
            objData = new LinkedHashMap<>(readEhsConfigJson());
        } catch (Exception e) {
            objData = new LinkedHashMap<>();
        }
        Map<String, Object> inner = new LinkedHashMap<>();
        inner.put("id", 1);
        inner.put("title", title);
        inner.put("content", content);
        inner.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        inner.put("link", link);
        inner.put("obj", objData);
        if (err != null) {
            inner.put("err", err);
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("code", code);
        res.put("msg", code == 200 ? "success" : "error");
        res.put("data", inner);
        return res;
    }

    private Map<String, Object> readConfigIni() throws IOException {
        Path config = Path.of(projectRoot, "config.conf");
        if (!Files.exists(config)) {
            return initConfigIni();
        }
        logger.info("读取配置文件: {}", config.toString());
        logger.info("读取配置文件: {}", projectRoot);
        Map<String, String> kv = parseSimpleIni(config);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("endStatus", Boolean.parseBoolean(kv.getOrDefault("endStatus", "true")));
        out.put("adminVerif", kv.getOrDefault("adminVerif", "n"));
        out.put("scriptToRun", kv.getOrDefault("scriptToRun", ""));
        out.put("logFile", kv.getOrDefault("logFile", ""));
        try {
            out.put("maxRetries", Integer.parseInt(kv.getOrDefault("maxRetries", "3")));
        } catch (NumberFormatException e) {
            out.put("maxRetries", 3);
        }
        out.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return out;
    }

    private Map<String, Object> initConfigIni() throws IOException {
        Map<String, String> kv = new LinkedHashMap<>();
        kv.put("adminVerif", "n");
        kv.put("endStatus", "true");
        kv.put("scriptToRun", "script.sh");
        kv.put("logFile", "static/logs/myscript.log");
        kv.put("maxRetries", "3");
        writeSimpleIni(Path.of(projectRoot, "config.conf"), kv);
        return readConfigIni();
    }

    private Map<String, Object> updateConfigIni(String id) throws IOException {
        Map<String, String> kv = new LinkedHashMap<>();
        kv.put("adminVerif", id);
        kv.put("endStatus", "true");
        kv.put("scriptToRun", "script.sh");
        kv.put("logFile", "static/logs/myscript.log");
        kv.put("maxRetries", "3");
        writeSimpleIni(Path.of(projectRoot, "config.conf"), kv);
        return readConfigIni();
    }

    private Map<String, Object> helpConfigIni() {
        return Map.of(
                "supported_operations", List.of("y", "n", "init", "help"),
                "date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                "usage", Map.of(
                        "GET /status/", "读取当前配置",
                        "GET /status/{id}", "执行指定操作"
                )
        );
    }

    private Map<String, String> parseSimpleIni(Path path) throws IOException {
        Map<String, String> map = new LinkedHashMap<>();
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        for (String line : lines) {
            String t = line.trim();
            if (t.isEmpty() || t.startsWith("#") || t.startsWith(";") || t.startsWith("[")) {
                continue;
            }
            int i = t.indexOf('=');
            if (i > 0) {
                String k = t.substring(0, i).trim();
                String v = t.substring(i + 1).trim();
                map.put(k, v);
            }
        }
        return map;
    }

    private void writeSimpleIni(Path path, Map<String, String> kv) throws IOException {
        List<String> lines = new ArrayList<>();
        lines.add("[Settings]");
        for (Map.Entry<String, String> entry : kv.entrySet()) {
            lines.add(entry.getKey() + " = " + entry.getValue());
        }
        Files.write(path, lines, StandardCharsets.UTF_8);
    }

    private long safeFileSize(Path path) {
        try {
            return Files.size(path);
        } catch (IOException e) {
            return 0L;
        }
    }

    private Map<String, Object> buildPictureGroup(Path baseDir, Path dir) {
        List<Map<String, Object>> children = new ArrayList<>();
        try (var stream = Files.list(dir)) {
            stream.filter(Files::isRegularFile).forEach(file -> {
                long size = safeFileSize(file);
                String ext = extensionOf(file.getFileName().toString());
                long modifiedTs = modifiedEpoch(file);
                Map<String, Object> fileInfo = new LinkedHashMap<>();
                fileInfo.put("name", file.getFileName().toString());
                fileInfo.put("size", size);
                fileInfo.put("size_human", humanSize(size));
                fileInfo.put("modified", modifiedTs);
                fileInfo.put("modified_human", formatTimestamp(modifiedTs));
                fileInfo.put("extension", ext);
                fileInfo.put("url", "/static/ehs/ehsImgs/" + dir.getFileName() + "/" + file.getFileName());
                fileInfo.put("selected", false);
                fileInfo.put("has_base64", false);
                children.add(fileInfo);
            });
        } catch (IOException ignored) {
        }

        Map<String, Object> group = new LinkedHashMap<>();
        group.put("id", dir.getFileName().toString());
        group.put("path", dir.toString());
        group.put("full_path", "/static/ehs/ehsImgs/" + dir.getFileName() + "/");
        group.put("children", children);
        group.put("image_count", 0);
        group.put("total_count", children.size());
        return group;
    }

    private String extensionOf(String name) {
        int i = name.lastIndexOf('.');
        return i >= 0 ? name.substring(i).toLowerCase() : "";
    }

    private long modifiedEpoch(Path file) {
        try {
            return Files.getLastModifiedTime(file).toMillis() / 1000;
        } catch (IOException e) {
            return 0L;
        }
    }

    private String formatTimestamp(long ts) {
        if (ts <= 0) {
            return "1970-01-01 00:00:00";
        }
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault())
                .format(java.time.Instant.ofEpochSecond(ts));
    }

    private String humanSize(long size) {
        double value = size;
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int idx = 0;
        while (value >= 1024 && idx < units.length - 1) {
            value /= 1024.0;
            idx++;
        }
        return String.format("%.2f %s", value, units[idx]);
    }

    private boolean compressImage(Path source, Path target) {
        try {
            BufferedImage image = ImageIO.read(source.toFile());
            if (image == null) {
                return false;
            }

            String ext = extensionOf(source.getFileName().toString()).replace(".", "");
            if ("jpg".equalsIgnoreCase(ext)) {
                ext = "jpeg";
            }
            if (ext.isBlank()) {
                ext = "jpeg";
            }

            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(ext);
            if (!writers.hasNext()) {
                return ImageIO.write(image, "jpeg", target.toFile());
            }

            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(0.8f);
            }

            try (ImageOutputStream ios = ImageIO.createImageOutputStream(target.toFile())) {
                writer.setOutput(ios);
                writer.write(null, new javax.imageio.IIOImage(image, null, null), param);
            } finally {
                writer.dispose();
            }
            return true;
        } catch (Exception e) {
            logger.warn("压缩图片失败: {}", e.getMessage());
            return false;
        }
    }

}
