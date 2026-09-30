package com.demo.application.dto;

import java.time.OffsetDateTime;

import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;

public record ItemResponse(
        Long id,
        String itemNumber,
        String itemName,
        String description,
        ItemType type,
        LifeCyclePhase lifeCyclePhase,
        String productFamily,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
