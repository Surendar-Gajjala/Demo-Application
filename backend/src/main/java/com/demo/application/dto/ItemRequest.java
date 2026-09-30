package com.demo.application.dto;

import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemRequest(
        @NotBlank @Size(max = 50) String itemNumber,
        @NotBlank @Size(max = 255) String itemName,
        String description,
        @NotNull ItemType type,
        @NotNull LifeCyclePhase lifeCyclePhase,
        @Size(max = 100) String productFamily) {
}
