package com.taskmanager.service;

import com.taskmanager.dto.AddMemberRequest;
import com.taskmanager.dto.ProjectRequest;
import com.taskmanager.dto.ProjectResponse;
import com.taskmanager.dto.UserResponse;
import com.taskmanager.exception.BadRequestException;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.model.*;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;

    public List<ProjectResponse> getAllProjects(User currentUser) {
        List<Project> projects;
        if (currentUser.getRole() == User.Role.ADMIN) {
            projects = projectRepository.findAll();
        } else {
            projects = projectRepository.findAllProjectsForUser(currentUser);
        }
        return projects.stream().map(p -> toResponse(p)).collect(Collectors.toList());
    }

    public ProjectResponse getProject(Long id, User currentUser) {
        Project project = findById(id);
        checkAccess(project, currentUser);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User owner) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Project.Status.ACTIVE)
                .owner(owner)
                .build();
        project = projectRepository.save(project);
        projectMemberRepository.save(ProjectMember.builder()
                .project(project).user(owner).memberRole(ProjectMember.MemberRole.OWNER).build());
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, User currentUser) {
        Project project = findById(id);
        if (!project.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only the project owner or admin can update this project");
        }
        project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project project = findById(id);
        if (!project.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only the project owner or admin can delete this project");
        }
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, AddMemberRequest request, User currentUser) {
        Project project = findById(projectId);
        if (!project.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only the project owner or admin can add members");
        }
        User newMember = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (projectMemberRepository.existsByProjectAndUser(project, newMember)) {
            throw new BadRequestException("User is already a member of this project");
        }
        projectMemberRepository.save(ProjectMember.builder()
                .project(project).user(newMember).memberRole(ProjectMember.MemberRole.MEMBER).build());
        return toResponse(projectRepository.findById(projectId).get());
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User currentUser) {
        Project project = findById(projectId);
        if (!project.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only the project owner can remove members");
        }
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (member.getId().equals(project.getOwner().getId())) {
            throw new BadRequestException("Cannot remove the project owner");
        }
        projectMemberRepository.deleteByProjectAndUser(project, member);
    }

    private Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void checkAccess(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        boolean isMember = projectMemberRepository.existsByProjectAndUser(project, user);
        if (!isMember) throw new AccessDeniedException("You don't have access to this project");
    }

    private ProjectResponse toResponse(Project project) {
        List<Task> tasks = taskRepository.findByProject(project);
        long done = tasks.stream().filter(t -> t.getStatus() == Task.Status.DONE).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        long todo = tasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();

        List<ProjectMember> members = projectMemberRepository.findByProject(project);
        List<ProjectResponse.MemberInfo> memberInfos = members.stream().map(m ->
                ProjectResponse.MemberInfo.builder()
                        .userId(m.getUser().getId())
                        .name(m.getUser().getName())
                        .email(m.getUser().getEmail())
                        .memberRole(m.getMemberRole().name())
                        .build()
        ).collect(Collectors.toList());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus().name())
                .owner(UserResponse.from(project.getOwner()))
                .members(memberInfos)
                .totalTasks(tasks.size())
                .completedTasks((int) done)
                .inProgressTasks((int) inProgress)
                .todoTasks((int) todo)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
