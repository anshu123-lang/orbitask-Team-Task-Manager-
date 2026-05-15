package com.taskmanager.controller;

import com.taskmanager.dto.TaskRequest;
import com.taskmanager.dto.TaskResponse;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getByProject(@PathVariable Long projectId, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, getUser(ud)));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> create(@PathVariable Long projectId, @Valid @RequestBody TaskRequest request, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(projectId, request, getUser(ud)));
    }

    @GetMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> getOne(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(taskService.getTask(id, getUser(ud)));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> update(@PathVariable Long id, @Valid @RequestBody TaskRequest request, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(taskService.updateTask(id, request, getUser(ud)));
    }

    @PatchMapping("/api/tasks/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, @AuthenticationPrincipal UserDetails ud) {
        Task.Status status = Task.Status.valueOf(body.get("status"));
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status, getUser(ud)));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        taskService.deleteTask(id, getUser(ud));
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername()).orElseThrow();
    }
}
