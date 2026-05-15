package com.taskmanager.service;

import com.taskmanager.dto.DashboardStats;
import com.taskmanager.dto.ProjectResponse;
import com.taskmanager.dto.TaskResponse;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectService projectService;

    public DashboardStats getStats(User currentUser) {
        List<TaskResponse> recentTasks;
        long totalProjects;
        long activeTasks;
        long overdueTasks;

        if (currentUser.getRole() == User.Role.ADMIN) {
            totalProjects = projectRepository.count();
            activeTasks = taskRepository.countAllActiveTasks();
            overdueTasks = taskRepository.countAllOverdueTasks(LocalDate.now());
            recentTasks = taskRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(8)
                    .map(TaskResponse::from)
                    .collect(Collectors.toList());
        } else {
            totalProjects = projectRepository.countProjectsForUser(currentUser);
            activeTasks = taskRepository.countActiveTasksForUser(currentUser);
            overdueTasks = taskRepository.countOverdueTasksForUser(currentUser, LocalDate.now());
            recentTasks = taskRepository.findRecentTasksForUser(currentUser).stream()
                    .limit(8)
                    .map(TaskResponse::from)
                    .collect(Collectors.toList());
        }

        // Task status distribution
        List<Task> allTasks = currentUser.getRole() == User.Role.ADMIN
                ? taskRepository.findAll()
                : taskRepository.findByAssignee(currentUser);

        Map<String, Long> tasksByStatus = allTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));

        List<ProjectResponse> recentProjects = projectService.getAllProjects(currentUser).stream()
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStats.builder()
                .totalProjects(totalProjects)
                .activeTasks(activeTasks)
                .overdueTasks(overdueTasks)
                .totalUsers(userRepository.count())
                .tasksByStatus(tasksByStatus)
                .recentTasks(recentTasks)
                .recentProjects(recentProjects)
                .build();
    }
}
