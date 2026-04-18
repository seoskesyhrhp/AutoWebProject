package com.smartchat.autoweb.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 大文件切片上传服务
 * 支持断网续传、文件秒传（MD5校验）、切片合并
 */
@Service
public class ChunkUploadService {

    private static final Logger logger = LoggerFactory.getLogger(ChunkUploadService.class);

    @Value("${app.project-root:../}")
    private String projectRoot;

    // 存储上传进度信息
    private final Map<String, UploadProgress> uploadProgressMap = new ConcurrentHashMap<>();

    /**
     * 获取目标保存目录
     * Linux: /usr/desktop/Webdemo/Djangodemo/ehs/target
     * 其他: static/target
     */
    public Path getTargetDirectory() {
        return getTargetDirectory(null);
    }

    /**
     * 获取目标保存目录（支持自定义子目录）
     * @param subDir 子目录，如 "json"、"static/target"，为null时使用默认目录
     */
    public Path getTargetDirectory(String subDir) {
        String osName = System.getProperty("os.name", "").toLowerCase();
        Path targetDir;

        if (subDir != null && !subDir.isBlank()) {
            // 使用指定的子目录
            targetDir = Paths.get(projectRoot, subDir.split("/"));
        } else if (osName.contains("linux")) {
            targetDir = Paths.get("/usr/desktop/Webdemo/Djangodemo/ehs/target");
        } else {
            targetDir = Paths.get(projectRoot, "static", "target");
        }

        try {
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
                logger.info("创建目标目录: {}", targetDir.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("创建目标目录失败: {}", e.getMessage());
            // 回退到项目目录
            targetDir = Paths.get(projectRoot, "static", "target");
            try {
                Files.createDirectories(targetDir);
            } catch (IOException ex) {
                logger.error("创建回退目录失败: {}", ex.getMessage());
            }
        }

        return targetDir;
    }

    // 存储每个上传任务的自定义目标目录
    private final Map<String, String> uploadTargetDirMap = new ConcurrentHashMap<>();

    /**
     * 获取临时目录（存储切片）
     */
    public Path getTempDirectory(String fileId) {
        return getTempDirectory(fileId, null);
    }

    /**
     * 获取临时目录（支持指定目标目录）
     * @param targetDir 目标子目录
     */
    public Path getTempDirectory(String fileId, String targetDir) {
        Path tempDir = getTargetDirectory(targetDir).resolve(".chunks").resolve(fileId);
        try {
            Files.createDirectories(tempDir);
        } catch (IOException e) {
            logger.error("创建临时目录失败: {}", e.getMessage());
        }
        return tempDir;
    }

    /**
     * 获取上传进度信息文件路径
     */
    public Path getProgressFile(String fileId) {
        return getTempDirectory(fileId).resolve(".progress.json");
    }

    /**
     * 初始化上传任务（使用默认目录）
     */
    public Map<String, Object> initUpload(String fileId, String filename, long fileSize, int totalChunks, String fileMd5) {
        return initUpload(fileId, filename, fileSize, totalChunks, fileMd5, null);
    }

    /**
     * 初始化上传任务（支持指定目标目录）
     * @param targetDir 目标子目录，如 "json"、"static/target"，为null时使用默认目录
     */
    public Map<String, Object> initUpload(String fileId, String filename, long fileSize, int totalChunks, String fileMd5, String targetDir) {
        try {
            Path targetDirPath = getTargetDirectory(targetDir);
            Path targetFile = targetDirPath.resolve(filename);

            // 保存该上传任务的目标目录
            if (targetDir != null && !targetDir.isBlank()) {
                uploadTargetDirMap.put(fileId, targetDir);
            }

            // 检查文件是否已存在（秒传）
            if (Files.exists(targetFile)) {
                String existingMd5 = calculateFileMd5(targetFile);
                if (fileMd5 != null && fileMd5.equalsIgnoreCase(existingMd5)) {
                    logger.info("文件已存在且MD5匹配，实现秒传: {}", filename);
                    return Map.of(
                            "code", 200,
                            "msg", "秒传成功，文件已存在",
                            "data", Map.of(
                                    "fileId", fileId,
                                    "filename", filename,
                                    "path", targetFile.toString(),
                                    "size", fileSize,
                                    "instant", true,
                                    "targetDir", targetDir != null ? targetDir : "default"
                            )
                    );
                }
                // 文件存在但MD5不同，需要替换
                logger.info("文件存在但内容不同，将替换: {}", filename);
            }

            // 创建临时目录
            Path tempDir = getTempDirectory(fileId, targetDir);

            // 保存进度信息
            UploadProgress progress = new UploadProgress();
            progress.setFileId(fileId);
            progress.setFilename(filename);
            progress.setFileSize(fileSize);
            progress.setTotalChunks(totalChunks);
            progress.setFileMd5(fileMd5);
            progress.setUploadedChunks(new HashSet<>());
            progress.setStartTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            saveProgress(progress);

            uploadProgressMap.put(fileId, progress);

            return Map.of(
                    "code", 200,
                    "msg", "初始化成功",
                    "data", Map.of(
                            "fileId", fileId,
                            "tempDir", tempDir.toString(),
                            "uploadedChunks", Collections.emptyList()
                    )
            );
        } catch (Exception e) {
            logger.error("初始化上传失败: {}", e.getMessage(), e);
            return Map.of("code", 500, "msg", "初始化失败: " + e.getMessage());
        }
    }

    /**
     * 上传切片
     */
    public Map<String, Object> uploadChunk(String fileId, int chunkIndex, byte[] chunkData, String chunkMd5) {
        try {
            UploadProgress progress = uploadProgressMap.computeIfAbsent(fileId, this::loadProgress);

            if (progress == null) {
                return Map.of("code", 404, "msg", "上传任务不存在，请重新初始化");
            }

            Path tempDir = getTempDirectory(fileId);
            Path chunkFile = tempDir.resolve(String.format("chunk_%d.tmp", chunkIndex));

            // 校验切片MD5
            String actualMd5 = calculateMd5(chunkData);
            if (chunkMd5 != null && !chunkMd5.equalsIgnoreCase(actualMd5)) {
                return Map.of("code", 400, "msg", "切片MD5校验失败");
            }

            // 写入切片
            Files.write(chunkFile, chunkData, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            // 更新进度
            progress.getUploadedChunks().add(chunkIndex);
            saveProgress(progress);

            int uploadedCount = progress.getUploadedChunks().size();
            int totalCount = progress.getTotalChunks();
            double percent = (double) uploadedCount / totalCount * 100;

            logger.info("切片上传成功: fileId={}, chunk={}/{}, progress={:.1f}%",
                    fileId, uploadedCount, totalCount, percent);

            return Map.of(
                    "code", 200,
                    "msg", "切片上传成功",
                    "data", Map.of(
                            "fileId", fileId,
                            "chunkIndex", chunkIndex,
                            "uploadedCount", uploadedCount,
                            "totalCount", totalCount,
                            "percent", String.format("%.1f", percent)
                    )
            );
        } catch (Exception e) {
            logger.error("切片上传失败: {}", e.getMessage(), e);
            return Map.of("code", 500, "msg", "切片上传失败: " + e.getMessage());
        }
    }

    /**
     * 合并切片
     */
    public Map<String, Object> mergeChunks(String fileId) {
        try {
            UploadProgress progress = uploadProgressMap.computeIfAbsent(fileId, this::loadProgress);

            if (progress == null) {
                return Map.of("code", 404, "msg", "上传任务不存在");
            }

            int totalChunks = progress.getTotalChunks();
            Set<Integer> uploadedChunks = progress.getUploadedChunks();

            // 检查是否所有切片都已上传
            if (uploadedChunks.size() != totalChunks) {
                Set<Integer> missing = new TreeSet<>();
                for (int i = 0; i < totalChunks; i++) {
                    if (!uploadedChunks.contains(i)) {
                        missing.add(i);
                    }
                }
                return Map.of(
                        "code", 400,
                        "msg", "切片未完整上传",
                        "data", Map.of(
                                "missingChunks", missing,
                                "uploadedCount", uploadedChunks.size(),
                                "totalCount", totalChunks
                        )
                );
            }

            // 获取该上传任务的目标目录
            String targetDirStr = uploadTargetDirMap.get(fileId);
            Path tempDir = getTempDirectory(fileId, targetDirStr);
            Path targetDir = getTargetDirectory(targetDirStr);
            Path targetFile = targetDir.resolve(progress.getFilename());

            // 如果目标文件存在，先删除
            if (Files.exists(targetFile)) {
                Files.delete(targetFile);
            }

            // 合并切片
            try (OutputStream os = new BufferedOutputStream(Files.newOutputStream(targetFile))) {
                for (int i = 0; i < totalChunks; i++) {
                    Path chunkFile = tempDir.resolve(String.format("chunk_%d.tmp", i));
                    if (Files.exists(chunkFile)) {
                        Files.copy(chunkFile, os);
                    }
                }
            }

            // 校验最终文件MD5
            String finalMd5 = calculateFileMd5(targetFile);
            boolean md5Match = progress.getFileMd5() == null ||
                    progress.getFileMd5().equalsIgnoreCase(finalMd5);

            // 清理临时文件
            deleteDirectory(tempDir);
            uploadProgressMap.remove(fileId);
            uploadTargetDirMap.remove(fileId);

            logger.info("文件合并成功: {}, size={}, md5={}", targetFile, Files.size(targetFile), finalMd5);

            return Map.of(
                    "code", 200,
                    "msg", "文件上传完成",
                    "data", Map.of(
                            "fileId", fileId,
                            "filename", progress.getFilename(),
                            "path", targetFile.toString(),
                            "size", Files.size(targetFile),
                            "md5", finalMd5,
                            "md5Match", md5Match
                    )
            );
        } catch (Exception e) {
            logger.error("合并切片失败: {}", e.getMessage(), e);
            return Map.of("code", 500, "msg", "合并失败: " + e.getMessage());
        }
    }

    /**
     * 获取上传进度
     */
    public Map<String, Object> getProgress(String fileId) {
        try {
            UploadProgress progress = uploadProgressMap.computeIfAbsent(fileId, this::loadProgress);

            if (progress == null) {
                return Map.of("code", 404, "msg", "上传任务不存在");
            }

            int uploadedCount = progress.getUploadedChunks().size();
            int totalCount = progress.getTotalChunks();
            double percent = totalCount > 0 ? (double) uploadedCount / totalCount * 100 : 0;

            // 检查缺失的切片
            Set<Integer> missing = new TreeSet<>();
            for (int i = 0; i < totalCount; i++) {
                if (!progress.getUploadedChunks().contains(i)) {
                    missing.add(i);
                }
            }

            return Map.of(
                    "code", 200,
                    "msg", "获取进度成功",
                    "data", Map.of(
                            "fileId", fileId,
                            "filename", progress.getFilename(),
                            "fileSize", progress.getFileSize(),
                            "uploadedCount", uploadedCount,
                            "totalCount", totalCount,
                            "percent", String.format("%.1f", percent),
                            "missingChunks", missing,
                            "startTime", progress.getStartTime()
                    )
            );
        } catch (Exception e) {
            return Map.of("code", 500, "msg", "获取进度失败: " + e.getMessage());
        }
    }

    /**
     * 取消上传，清理临时文件
     */
    public Map<String, Object> cancelUpload(String fileId) {
        try {
            // 获取该上传任务的目标目录
            String targetDirStr = uploadTargetDirMap.get(fileId);
            Path tempDir = getTempDirectory(fileId, targetDirStr);
            if (Files.exists(tempDir)) {
                deleteDirectory(tempDir);
            }
            uploadProgressMap.remove(fileId);
            uploadTargetDirMap.remove(fileId);

            return Map.of("code", 200, "msg", "已取消上传并清理临时文件");
        } catch (Exception e) {
            return Map.of("code", 500, "msg", "取消失败: " + e.getMessage());
        }
    }

    /**
     * 检查已上传的切片
     */
    public Map<String, Object> checkUploaded(String fileId) {
        try {
            UploadProgress progress = loadProgress(fileId);

            if (progress == null) {
                // 检查临时目录中是否有切片文件
                Path tempDir = getTempDirectory(fileId);
                if (!Files.exists(tempDir)) {
                    return Map.of("code", 404, "msg", "上传任务不存在");
                }

                // 扫描已有切片
                Set<Integer> existingChunks = new HashSet<>();
                try (var stream = Files.list(tempDir)) {
                    stream.filter(Files::isRegularFile)
                            .filter(p -> p.getFileName().toString().startsWith("chunk_"))
                            .forEach(p -> {
                                String name = p.getFileName().toString();
                                try {
                                    int idx = Integer.parseInt(name.replace("chunk_", "").replace(".tmp", ""));
                                    existingChunks.add(idx);
                                } catch (NumberFormatException ignored) {
                                }
                            });
                }

                return Map.of(
                        "code", 200,
                        "msg", "发现断点续传数据",
                        "data", Map.of(
                                "fileId", fileId,
                                "uploadedChunks", existingChunks
                        )
                );
            }

            return Map.of(
                    "code", 200,
                    "msg", "获取成功",
                    "data", Map.of(
                            "fileId", fileId,
                            "uploadedChunks", progress.getUploadedChunks()
                    )
            );
        } catch (Exception e) {
            return Map.of("code", 500, "msg", "检查失败: " + e.getMessage());
        }
    }

    /**
     * 列出已上传的文件
     */
    public Map<String, Object> listFiles() {
        try {
            Path targetDir = getTargetDirectory();
            List<Map<String, Object>> files = new ArrayList<>();

            if (Files.exists(targetDir)) {
                try (var stream = Files.list(targetDir)) {
                    stream.filter(Files::isRegularFile)
                            .sorted((a, b) -> {
                                try {
                                    return Files.getLastModifiedTime(b).compareTo(Files.getLastModifiedTime(a));
                                } catch (IOException e) {
                                    return 0;
                                }
                            })
                            .forEach(path -> {
                                try {
                                    Map<String, Object> fileInfo = new HashMap<>();
                                    fileInfo.put("name", path.getFileName().toString());
                                    fileInfo.put("size", Files.size(path));
                                    fileInfo.put("modified", Files.getLastModifiedTime(path).toString());
                                    fileInfo.put("path", path.toString());
                                    files.add(fileInfo);
                                } catch (IOException ignored) {
                                }
                            });
                }
            }

            return Map.of(
                    "code", 200,
                    "msg", "获取成功",
                    "data", Map.of(
                            "files", files,
                            "directory", targetDir.toString(),
                            "total", files.size()
                    )
            );
        } catch (Exception e) {
            return Map.of("code", 500, "msg", "获取文件列表失败: " + e.getMessage());
        }
    }

    // ==================== 私有方法 ====================

    private void saveProgress(UploadProgress progress) {
        try {
            Path progressFile = getProgressFile(progress.getFileId());
            StringBuilder sb = new StringBuilder();
            sb.append("fileId=").append(progress.getFileId()).append("\n");
            sb.append("filename=").append(progress.getFilename()).append("\n");
            sb.append("fileSize=").append(progress.getFileSize()).append("\n");
            sb.append("totalChunks=").append(progress.getTotalChunks()).append("\n");
            sb.append("fileMd5=").append(progress.getFileMd5() != null ? progress.getFileMd5() : "").append("\n");
            sb.append("startTime=").append(progress.getStartTime() != null ? progress.getStartTime() : "").append("\n");
            sb.append("uploadedChunks=").append(String.join(",",
                    progress.getUploadedChunks().stream().map(String::valueOf).toList())).append("\n");

            Files.writeString(progressFile, sb.toString());
        } catch (IOException e) {
            logger.error("保存进度失败: {}", e.getMessage());
        }
    }

    private UploadProgress loadProgress(String fileId) {
        try {
            Path progressFile = getProgressFile(fileId);
            if (!Files.exists(progressFile)) {
                return null;
            }

            String content = Files.readString(progressFile);
            Map<String, String> map = new HashMap<>();
            for (String line : content.split("\n")) {
                int idx = line.indexOf('=');
                if (idx > 0) {
                    map.put(line.substring(0, idx).trim(), line.substring(idx + 1).trim());
                }
            }

            UploadProgress progress = new UploadProgress();
            progress.setFileId(map.getOrDefault("fileId", fileId));
            progress.setFilename(map.get("filename"));
            progress.setFileSize(Long.parseLong(map.getOrDefault("fileSize", "0")));
            progress.setTotalChunks(Integer.parseInt(map.getOrDefault("totalChunks", "0")));
            progress.setFileMd5(map.get("fileMd5"));
            progress.setStartTime(map.get("startTime"));

            Set<Integer> uploaded = new HashSet<>();
            String chunksStr = map.get("uploadedChunks");
            if (chunksStr != null && !chunksStr.isBlank()) {
                for (String s : chunksStr.split(",")) {
                    if (!s.isBlank()) {
                        uploaded.add(Integer.parseInt(s.trim()));
                    }
                }
            }
            progress.setUploadedChunks(uploaded);

            return progress;
        } catch (Exception e) {
            logger.error("加载进度失败: {}", e.getMessage());
            return null;
        }
    }

    private String calculateMd5(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String calculateFileMd5(Path file) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            try (InputStream is = Files.newInputStream(file)) {
                byte[] buffer = new byte[8192];
                int len;
                while ((len = is.read(buffer)) != -1) {
                    md.update(buffer, 0, len);
                }
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            logger.error("计算文件MD5失败: {}", e.getMessage());
            return "";
        }
    }

    private void deleteDirectory(Path dir) {
        try {
            if (Files.exists(dir)) {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException ignored) {
                            }
                        });
            }
        } catch (IOException e) {
            logger.error("删除目录失败: {}", e.getMessage());
        }
    }

    /**
     * 上传进度信息
     */
    public static class UploadProgress {
        private String fileId;
        private String filename;
        private long fileSize;
        private int totalChunks;
        private String fileMd5;
        private String startTime;
        private Set<Integer> uploadedChunks;

        // Getters and Setters
        public String getFileId() { return fileId; }
        public void setFileId(String fileId) { this.fileId = fileId; }
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
        public int getTotalChunks() { return totalChunks; }
        public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
        public String getFileMd5() { return fileMd5; }
        public void setFileMd5(String fileMd5) { this.fileMd5 = fileMd5; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public Set<Integer> getUploadedChunks() { return uploadedChunks; }
        public void setUploadedChunks(Set<Integer> uploadedChunks) { this.uploadedChunks = uploadedChunks; }
    }
}
