package com.ehs.web.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Component
public class JsonFileUtil {

    private final ObjectMapper objectMapper;

    public JsonFileUtil(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(Path path, Object data) throws IOException {
        Files.createDirectories(path.getParent());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), data);
    }

    public JsonNode readTree(Path path) throws IOException {
        return objectMapper.readTree(Files.readString(path, StandardCharsets.UTF_8));
    }

    public <T> T read(Path path, TypeReference<T> type) throws IOException {
        return objectMapper.readValue(path.toFile(), type);
    }

    public void mergeJsonFilesInDirectory(Path directory, Path outputFile) throws IOException {
        if (!Files.isDirectory(directory)) {
            Files.createDirectories(directory);
        }
        List<JsonNode> merged = new ArrayList<>();
        try (var stream = Files.list(directory)) {
            stream.filter(p -> p.toString().endsWith(".json")).sorted().forEach(p -> {
                try {
                    JsonNode n = readTree(p);
                    if (n != null && !n.isNull()) {
                        merged.add(n);
                    }
                } catch (IOException ignored) {
                }
            });
        }
        Files.createDirectories(outputFile.getParent());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputFile.toFile(), merged);
    }
}
