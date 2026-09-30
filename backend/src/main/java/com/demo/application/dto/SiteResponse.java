package com.demo.application.dto;

import java.time.OffsetDateTime;

public record SiteResponse(
        Long id,
        String siteName,
        String siteType,
        String workcenter,
        String address,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
