package com.demo.application.dto;

import java.util.List;
import java.util.Map;

import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;

public record DashboardSummary(
        long totalItems,
        long totalParts,
        long totalSites,
        Map<LifeCyclePhase, Long> itemsByLifeCyclePhase,
        Map<ItemType, Long> itemsByType,
        long totalBomLinks,
        List<ItemResponse> recentlyCreatedItems,
        List<ItemResponse> recentlyUpdatedItems) {
}
