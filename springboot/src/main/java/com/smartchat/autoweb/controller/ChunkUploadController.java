package com.smartchat.autoweb.controller;

import com.smartchat.autoweb.service.ChunkUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 大文件切片上传控制器
 * 
 * 功能：
 * - 支持大文件切片上传
 * - 支持断网续传
 * - 支持文件秒传（MD5校验）
 * - 文件存在则替换
 * 
 * 保存路径：
 * - Linux: /usr/desktop/Webdemo/Djangodemo/ehs/target
 * - 其他系统: static/target
 */
@RestController
@RequestMapping("/upload")
public class ChunkUploadController {

    private static final Logger logger = LoggerFactory.getLogger(ChunkUploadController.class);

    private final ChunkUploadService chunkUploadService;

    public ChunkUploadController(ChunkUploadService chunkUploadService) {
        this.chunkUploadService = chunkUploadService;
    }

    /**
     * 初始化上传任务
     * 
     * @param fileId 文件唯一标识（建议使用MD5）
     * @param filename 文件名
     * @param fileSize 文件总大小
     * @param totalChunks 总切片数
     * @param fileMd5 文件MD5（用于秒传校验）
     * @param targetDir 目标目录，如 "json"、"static/target"，为空时使用默认目录
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initUpload(
            @RequestParam("fileId") String fileId,
            @RequestParam("filename") String filename,
            @RequestParam("fileSize") long fileSize,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam(value = "fileMd5", required = false) String fileMd5,
            @RequestParam(value = "targetDir", required = false) String targetDir
    ) {
        logger.info("初始化上传: fileId={}, filename={}, size={}, chunks={}, md5={}, targetDir={}",
                fileId, filename, fileSize, totalChunks, fileMd5, targetDir);

        Map<String, Object> result = chunkUploadService.initUpload(fileId, filename, fileSize, totalChunks, fileMd5, targetDir);
        return ResponseEntity.ok(result);
    }

    /**
     * 上传切片
     * 
     * @param fileId 文件唯一标识
     * @param chunkIndex 切片索引（从0开始）
     * @param chunk 切片数据
     * @param chunkMd5 切片MD5（可选，用于校验）
     */
    @PostMapping("/chunk")
    public ResponseEntity<Map<String, Object>> uploadChunk(
            @RequestParam("fileId") String fileId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("chunk") MultipartFile chunk,
            @RequestParam(value = "chunkMd5", required = false) String chunkMd5
    ) {
        try {
            logger.debug("上传切片: fileId={}, chunk={}, size={}", fileId, chunkIndex, chunk.getSize());

            Map<String, Object> result = chunkUploadService.uploadChunk(
                    fileId,
                    chunkIndex,
                    chunk.getBytes(),
                    chunkMd5
            );
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            logger.error("读取切片数据失败: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "code", 500,
                    "msg", "读取切片数据失败: " + e.getMessage()
            ));
        }
    }

    /**
     * 合并切片
     * 
     * @param fileId 文件唯一标识
     */
    @PostMapping("/merge")
    public ResponseEntity<Map<String, Object>> mergeChunks(
            @RequestParam("fileId") String fileId
    ) {
        logger.info("合并切片: fileId={}", fileId);

        Map<String, Object> result = chunkUploadService.mergeChunks(fileId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取上传进度
     * 
     * @param fileId 文件唯一标识
     */
    @GetMapping("/progress/{fileId}")
    public ResponseEntity<Map<String, Object>> getProgress(
            @PathVariable("fileId") String fileId
    ) {
        Map<String, Object> result = chunkUploadService.getProgress(fileId);
        return ResponseEntity.ok(result);
    }

    /**
     * 检查已上传的切片（断点续传）
     * 
     * @param fileId 文件唯一标识
     */
    @GetMapping("/check/{fileId}")
    public ResponseEntity<Map<String, Object>> checkUploaded(
            @PathVariable("fileId") String fileId
    ) {
        Map<String, Object> result = chunkUploadService.checkUploaded(fileId);
        return ResponseEntity.ok(result);
    }

    /**
     * 取消上传
     * 
     * @param fileId 文件唯一标识
     */
    @DeleteMapping("/cancel/{fileId}")
    public ResponseEntity<Map<String, Object>> cancelUpload(
            @PathVariable("fileId") String fileId
    ) {
        logger.info("取消上传: fileId={}", fileId);

        Map<String, Object> result = chunkUploadService.cancelUpload(fileId);
        return ResponseEntity.ok(result);
    }

    /**
     * 列出已上传的文件
     */
    @GetMapping("/files")
    public ResponseEntity<Map<String, Object>> listFiles() {
        Map<String, Object> result = chunkUploadService.listFiles();
        return ResponseEntity.ok(result);
    }

    /**
     * 获取系统信息和保存路径
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        String osName = System.getProperty("os.name", "Unknown");
        String osVersion = System.getProperty("os.version", "");
        String userDir = System.getProperty("user.dir", "");
        String targetDir = chunkUploadService.getTargetDirectory().toString();

        return ResponseEntity.ok(Map.of(
                "code", 200,
                "msg", "success",
                "data", Map.of(
                        "osName", osName,
                        "osVersion", osVersion,
                        "userDir", userDir,
                        "targetDirectory", targetDir,
                        "isLinux", osName.toLowerCase().contains("linux")
                )
        ));
    }
}
