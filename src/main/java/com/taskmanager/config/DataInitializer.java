package com.taskmanager.config;

import com.taskmanager.model.*;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        log.info("Seeding initial data...");

        // Create users
        User admin = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@taskmanager.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(User.Role.ADMIN)
                .build());

        User alice = userRepository.save(User.builder()
                .name("Alice Johnson")
                .email("alice@taskmanager.com")
                .password(passwordEncoder.encode("Member@123"))
                .role(User.Role.MEMBER)
                .build());

        User bob = userRepository.save(User.builder()
                .name("Bob Smith")
                .email("bob@taskmanager.com")
                .password(passwordEncoder.encode("Member@123"))
                .role(User.Role.MEMBER)
                .build());

        User carol = userRepository.save(User.builder()
                .name("Carol Williams")
                .email("carol@taskmanager.com")
                .password(passwordEncoder.encode("Member@123"))
                .role(User.Role.MEMBER)
                .build());

        // Create Project 1
        Project p1 = projectRepository.save(Project.builder()
                .name("Phoenix Redesign")
                .description("Complete overhaul of the main product UI/UX with modern design principles and improved user flows.")
                .status(Project.Status.ACTIVE)
                .owner(admin)
                .build());

        projectMemberRepository.save(ProjectMember.builder().project(p1).user(admin).memberRole(ProjectMember.MemberRole.OWNER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p1).user(alice).memberRole(ProjectMember.MemberRole.MEMBER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p1).user(bob).memberRole(ProjectMember.MemberRole.MEMBER).build());

        taskRepository.save(Task.builder().title("Design new dashboard layout").description("Create wireframes and high-fidelity mockups for the main dashboard.").status(Task.Status.DONE).priority(Task.Priority.HIGH).project(p1).assignee(alice).creator(admin).dueDate(LocalDate.now().minusDays(3)).build());
        taskRepository.save(Task.builder().title("Implement responsive navigation").description("Build the new nav component with mobile support.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.HIGH).project(p1).assignee(bob).creator(admin).dueDate(LocalDate.now().plusDays(2)).build());
        taskRepository.save(Task.builder().title("User testing & feedback").description("Conduct user testing sessions and collect feedback.").status(Task.Status.TODO).priority(Task.Priority.MEDIUM).project(p1).assignee(alice).creator(admin).dueDate(LocalDate.now().plusDays(7)).build());
        taskRepository.save(Task.builder().title("Performance optimization").description("Optimize bundle size and loading times.").status(Task.Status.TODO).priority(Task.Priority.LOW).project(p1).assignee(bob).creator(admin).dueDate(LocalDate.now().plusDays(10)).build());
        taskRepository.save(Task.builder().title("Accessibility audit").description("Ensure WCAG 2.1 AA compliance across all new components.").status(Task.Status.IN_REVIEW).priority(Task.Priority.MEDIUM).project(p1).assignee(alice).creator(admin).dueDate(LocalDate.now().plusDays(1)).build());

        // Create Project 2
        Project p2 = projectRepository.save(Project.builder()
                .name("API Gateway v2")
                .description("Rebuild the API gateway with improved rate limiting, caching, and observability features.")
                .status(Project.Status.ACTIVE)
                .owner(alice)
                .build());

        projectMemberRepository.save(ProjectMember.builder().project(p2).user(alice).memberRole(ProjectMember.MemberRole.OWNER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p2).user(bob).memberRole(ProjectMember.MemberRole.MEMBER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p2).user(carol).memberRole(ProjectMember.MemberRole.MEMBER).build());

        taskRepository.save(Task.builder().title("Architecture planning").description("Design the new gateway architecture with service mesh integration.").status(Task.Status.DONE).priority(Task.Priority.CRITICAL).project(p2).assignee(alice).creator(alice).dueDate(LocalDate.now().minusDays(10)).build());
        taskRepository.save(Task.builder().title("Rate limiting module").description("Implement token bucket rate limiting per API key.").status(Task.Status.DONE).priority(Task.Priority.HIGH).project(p2).assignee(bob).creator(alice).dueDate(LocalDate.now().minusDays(5)).build());
        taskRepository.save(Task.builder().title("Redis caching layer").description("Integrate Redis for response caching with TTL management.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.HIGH).project(p2).assignee(carol).creator(alice).dueDate(LocalDate.now().plusDays(3)).build());
        taskRepository.save(Task.builder().title("Distributed tracing setup").description("Integrate Jaeger for distributed request tracing.").status(Task.Status.TODO).priority(Task.Priority.MEDIUM).project(p2).assignee(bob).creator(alice).dueDate(LocalDate.now().plusDays(8)).build());

        // Create Project 3
        Project p3 = projectRepository.save(Project.builder()
                .name("Mobile App Beta")
                .description("Launch the mobile application beta with core features for iOS and Android platforms.")
                .status(Project.Status.ACTIVE)
                .owner(bob)
                .build());

        projectMemberRepository.save(ProjectMember.builder().project(p3).user(bob).memberRole(ProjectMember.MemberRole.OWNER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p3).user(carol).memberRole(ProjectMember.MemberRole.MEMBER).build());
        projectMemberRepository.save(ProjectMember.builder().project(p3).user(admin).memberRole(ProjectMember.MemberRole.MEMBER).build());

        taskRepository.save(Task.builder().title("Push notifications").description("Implement Firebase push notifications for iOS and Android.").status(Task.Status.IN_PROGRESS).priority(Task.Priority.HIGH).project(p3).assignee(carol).creator(bob).dueDate(LocalDate.now().minusDays(1)).build());
        taskRepository.save(Task.builder().title("Offline mode").description("Implement offline data sync using local SQLite storage.").status(Task.Status.TODO).priority(Task.Priority.HIGH).project(p3).assignee(bob).creator(bob).dueDate(LocalDate.now().plusDays(5)).build());
        taskRepository.save(Task.builder().title("Beta testing program").description("Set up TestFlight and Google Play internal testing.").status(Task.Status.TODO).priority(Task.Priority.MEDIUM).project(p3).assignee(admin).creator(bob).dueDate(LocalDate.now().plusDays(12)).build());

        log.info("✅ Seeding complete! Admin: admin@taskmanager.com / Admin@123");
    }
}
