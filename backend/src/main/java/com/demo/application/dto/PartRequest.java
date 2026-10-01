package com.demo.application.dto;

import com.demo.application.model.LifeCyclePhase;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PartRequest(
        @NotBlank @Size(max = 50) String partNumber,
        @NotBlank @Size(max = 255) String partName,
        String description,
        @Size(max = 255) String manufactureName,
        @NotNull LifeCyclePhase lifeCyclePhase,
        /** Optional parent item; null = not assigned. */
        Long itemId) {
}
