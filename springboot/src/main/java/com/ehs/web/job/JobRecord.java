package com.ehs.web.job;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class JobRecord {

    private final String id;
    private final JobType type;
    private volatile JobStatus status = JobStatus.QUEUED;
    private final List<String> logs = Collections.synchronizedList(new ArrayList<>());
    private volatile String errorMessage;
    private volatile Instant startedAt;
    private volatile Instant finishedAt;

    public JobRecord(String id, JobType type) {
        this.id = id;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public JobType getType() {
        return type;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public List<String> getLogs() {
        return logs;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public void appendLog(String line) {
        String ts = java.time.LocalTime.now().toString();
        logs.add("[" + ts + "] " + line);
        if (logs.size() > 8000) {
            logs.subList(0, 1000).clear();
        }
    }
}
