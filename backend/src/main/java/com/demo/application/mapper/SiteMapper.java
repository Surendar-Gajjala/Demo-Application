package com.demo.application.mapper;

import com.demo.application.dto.SiteRequest;
import com.demo.application.dto.SiteResponse;
import com.demo.application.model.Site;

public final class SiteMapper {

    private SiteMapper() {
    }

    public static SiteResponse toResponse(Site site) {
        return new SiteResponse(
                site.getId(),
                site.getSiteName(),
                site.getSiteType(),
                site.getWorkcenter(),
                site.getAddress(),
                site.getCreatedAt(),
                site.getUpdatedAt());
    }

    /** Copies every request field onto the entity (create and full update). */
    public static void apply(SiteRequest request, Site site) {
        site.setSiteName(request.siteName().trim());
        site.setSiteType(request.siteType());
        site.setWorkcenter(request.workcenter());
        site.setAddress(request.address());
    }
}
