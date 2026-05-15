package com.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalProjects;
    private long activeTasks;
    private long overdueTasks;
    private long totalUsers;
    private Map<String, Long> tasksByStatus;
    private List<TaskResponse> recentTasks;
    private List<ProjectResponse> recentProjects;
}
