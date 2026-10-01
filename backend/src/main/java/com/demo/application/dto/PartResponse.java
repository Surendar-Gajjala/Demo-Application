package com.demo.application.dto;

import java.time.OffsetDateTime;

import com.demo.application.model.LifeCyclePhase;

public record PartResponse(
        Long id,
        String partNumber,
        String partName,
        String description,
        String manufactureName,
        LifeCyclePhase lifeCyclePhase,
        /** Parent item, all null when the part is not assigned. */
        Long itemId,
        String itemNumber,
        String itemName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
