package com.demo.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteRequest(
        @NotBlank @Size(max = 255) String siteName,
        @Size(max = 100) String siteType,
        @Size(max = 100) String workcenter,
        String address) {
}
