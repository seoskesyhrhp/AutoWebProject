package com.ehs.web.job;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping("/start")
    public ResponseEntity<StartResponse> start(@RequestBody StartRequest req) {
        JobType type = JobType.valueOf(req.getType().trim().toUpperCase());
        int state = req.getState() != null ? req.getState() : 0;
        JobRecord rec = jobService.start(type, state);
        StartResponse resp = new StartResponse();
        resp.setJobId(rec.getId());
        resp.setStatus(rec.getStatus().name());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobView> get(@PathVariable String id) {
        JobRecord rec = jobService.get(id);
        if (rec == null) {
            return ResponseEntity.notFound().build();
        }
        JobView v = new JobView();
        v.setId(rec.getId());
        v.setType(rec.getType().name());
        v.setStatus(rec.getStatus().name());
        v.setError(rec.getErrorMessage());
        v.setStartedAt(rec.getStartedAt());
        v.setFinishedAt(rec.getFinishedAt());
        v.setLogs(List.copyOf(rec.getLogs()));
        return ResponseEntity.ok(v);
    }

    public static class StartRequest {
        private String type;
        private Integer state;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Integer getState() {
            return state;
        }

        public void setState(Integer state) {
            this.state = state;
        }
    }

    public static class StartResponse {
        private String jobId;
        private String status;

        public String getJobId() {
            return jobId;
        }

        public void setJobId(String jobId) {
            this.jobId = jobId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class JobView {
        private String id;
        private String type;
        private String status;
        private String error;
        private java.time.Instant startedAt;
        private java.time.Instant finishedAt;
        private List<String> logs;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public java.time.Instant getStartedAt() {
            return startedAt;
        }

        public void setStartedAt(java.time.Instant startedAt) {
            this.startedAt = startedAt;
        }

        public java.time.Instant getFinishedAt() {
            return finishedAt;
        }

        public void setFinishedAt(java.time.Instant finishedAt) {
            this.finishedAt = finishedAt;
        }

        public List<String> getLogs() {
            return logs;
        }

        public void setLogs(List<String> logs) {
            this.logs = logs;
        }
    }
}
