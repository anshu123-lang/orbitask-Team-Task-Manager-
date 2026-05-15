package com.taskmanager.dto;

import com.taskmanager.model.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String name;
    private String description;
    private Project.Status status;
}
