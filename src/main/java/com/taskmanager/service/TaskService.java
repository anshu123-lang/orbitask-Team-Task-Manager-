package com.taskmanager.service;

import com.taskmanager.dto.TaskRequest;
import com.taskmanager.dto.TaskResponse;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.model.Project;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public List<TaskResponse> getTasksByProject(Long projectId, User currentUser) {
        Project project = findProject(projectId);
        checkProjectAccess(project, currentUser);
        return taskRepository.findByProjectOrderByCreatedAtDesc(project)
                .stream().map(TaskResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse createTask(Long projectId, TaskRequest request, User creator) {
        Project project = findProject(projectId);
        checkProjectAccess(project, creator);
        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Task.Status.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : Task.Priority.MEDIUM)
                .dueDate(request.getDueDate())
                .project(project)
                .assignee(assignee)
                .creator(creator)
                .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest request, User currentUser) {
        Task task = findTask(taskId);
        checkTaskAccess(task, currentUser);
        task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, Task.Status status, User currentUser) {
        Task task = findTask(taskId);
        checkProjectAccess(task.getProject(), currentUser);
        task.setStatus(status);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId, User currentUser) {
        Task task = findTask(taskId);
        checkTaskAccess(task, currentUser);
        taskRepository.delete(task);
    }

    public TaskResponse getTask(Long taskId, User currentUser) {
        Task task = findTask(taskId);
        checkProjectAccess(task.getProject(), currentUser);
        return TaskResponse.from(task);
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void checkProjectAccess(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (!projectMemberRepository.existsByProjectAndUser(project, user)) {
            throw new AccessDeniedException("You don't have access to this project");
        }
    }

    private void checkTaskAccess(Task task, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        boolean isCreator = task.getCreator().getId().equals(user.getId());
        boolean isProjectMember = projectMemberRepository.existsByProjectAndUser(task.getProject(), user);
        if (!isCreator && !isProjectMember) {
            throw new AccessDeniedException("You don't have permission to modify this task");
        }
    }
}
