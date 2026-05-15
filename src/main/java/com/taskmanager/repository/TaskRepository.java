package com.taskmanager.repository;

import com.taskmanager.model.Project;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProject(Project project);

    List<Task> findByProjectOrderByCreatedAtDesc(Project project);

    List<Task> findByAssignee(User assignee);

    List<Task> findByAssigneeOrderByCreatedAtDesc(User assignee);

    @Query("SELECT t FROM Task t WHERE t.assignee = :user ORDER BY t.createdAt DESC")
    List<Task> findRecentTasksForUser(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee = :user AND t.status != 'DONE'")
    long countActiveTasksForUser(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee = :user AND t.dueDate < :today AND t.status != 'DONE'")
    long countOverdueTasksForUser(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.status != 'DONE'")
    long countAllActiveTasks();

    @Query("SELECT COUNT(t) FROM Task t WHERE t.dueDate < :today AND t.status != 'DONE'")
    long countAllOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.project = :project AND t.status = :status")
    List<Task> findByProjectAndStatus(@Param("project") Project project, @Param("status") Task.Status status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project = :project AND t.status = 'DONE'")
    long countDoneTasksByProject(@Param("project") Project project);
}
