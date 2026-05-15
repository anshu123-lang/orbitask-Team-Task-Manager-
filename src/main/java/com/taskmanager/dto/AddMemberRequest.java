package com.taskmanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddMemberRequest {
    @NotNull
    private Long userId;
}
