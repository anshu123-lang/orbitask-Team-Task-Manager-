package com.taskmanager.dto;

import com.taskmanager.model.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long projectId;
    private String projectName;
    private UserResponse assignee;
    private UserResponse creator;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean overdue;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .dueDate(task.getDueDate())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getName() : null)
                .assignee(UserResponse.from(task.getAssignee()))
                .creator(UserResponse.from(task.getCreator()))
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .overdue(task.getDueDate() != null && task.getDueDate().isBefore(LocalDate.now()) && task.getStatus() != Task.Status.DONE)
                .build();
    }
}
