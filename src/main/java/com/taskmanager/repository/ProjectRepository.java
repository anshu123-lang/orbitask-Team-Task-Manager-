package com.taskmanager.repository;

import com.taskmanager.model.Project;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwner(User owner);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.members m WHERE p.owner = :user OR m.user = :user ORDER BY p.updatedAt DESC")
    List<Project> findAllProjectsForUser(@Param("user") User user);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.owner = :user OR EXISTS (SELECT m FROM ProjectMember m WHERE m.project = p AND m.user = :user)")
    long countProjectsForUser(@Param("user") User user);
}
