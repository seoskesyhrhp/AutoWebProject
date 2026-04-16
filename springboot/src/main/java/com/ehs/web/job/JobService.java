package com.ehs.web.job;

import com.ehs.web.service.InspectionCycleService;
import com.ehs.web.service.PatrolRouteTaskService;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class JobService {

    private final InspectionCycleService inspectionCycleService;
    private final PatrolRouteTaskService patrolRouteTaskService;
    private final Map<String, JobRecord> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r);
        t.setName("ehs-job-" + t.getId());
        t.setDaemon(true);
        return t;
    });

    public JobService(InspectionCycleService inspectionCycleService, PatrolRouteTaskService patrolRouteTaskService) {
        this.inspectionCycleService = inspectionCycleService;
        this.patrolRouteTaskService = patrolRouteTaskService;
    }

    public JobRecord start(JobType type, int state) {
        String id = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        JobRecord rec = new JobRecord(id, type);
        jobs.put(id, rec);
        rec.setStatus(JobStatus.RUNNING);
        rec.setStartedAt(java.time.Instant.now());
        executor.submit(() -> runJob(rec, state));
        return rec;
    }

    public JobRecord get(String id) {
        return jobs.get(id);
    }

    private void runJob(JobRecord rec, int state) {
        try {
            switch (rec.getType()) {
                case APP_TWO -> inspectionCycleService.runAppTwoCycle(state, rec::appendLog);
                case APP_THREE -> inspectionCycleService.runAppThreeCycle(state, rec::appendLog);
                case SUBMIT_TWO -> patrolRouteTaskService.runSubmitWorkflow(state, rec::appendLog);
                case SUBMIT_THREE -> patrolRouteTaskService.runSubmitWorkflow(state, rec::appendLog);
            }
            rec.setStatus(JobStatus.SUCCEEDED);
        } catch (Exception e) {
            rec.setStatus(JobStatus.FAILED);
            rec.setErrorMessage(e.getMessage());
            rec.appendLog("ERROR: " + e.getMessage());
        } finally {
            rec.setFinishedAt(java.time.Instant.now());
        }
    }
}
