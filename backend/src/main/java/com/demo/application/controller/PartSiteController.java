package com.demo.application.controller;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartResponse;
import com.demo.application.dto.SiteResponse;
import com.demo.application.service.PartSiteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Part N : N Site, reachable from both sides; both routes change the same part_site row. */
@RestController
@RequestMapping("/api")
public class PartSiteController {

    private final PartSiteService partSiteService;

    public PartSiteController(PartSiteService partSiteService) {
        this.partSiteService = partSiteService;
    }

    // ---- Part -> Sites ------------------------------------------------------

    @GetMapping("/parts/{partId}/sites")
    public PageResponse<SiteResponse> sitesOfPart(
            @PathVariable Long partId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, SiteController.SORT_FIELDS, SiteController.DEFAULT_SORT);
        return partSiteService.sitesOfPart(partId, search, pageable);
    }

    @GetMapping("/parts/{partId}/sites/candidates")
    public PageResponse<SiteResponse> siteCandidates(
            @PathVariable Long partId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, SiteController.SORT_FIELDS, SiteController.DEFAULT_SORT);
        return partSiteService.siteCandidates(partId, search, pageable);
    }

    @PostMapping("/parts/{partId}/sites/{siteId}")
    public ResponseEntity<Void> linkFromPart(@PathVariable Long partId, @PathVariable Long siteId) {
        partSiteService.link(partId, siteId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/parts/{partId}/sites/{siteId}")
    public ResponseEntity<Void> unlinkFromPart(@PathVariable Long partId, @PathVariable Long siteId) {
        partSiteService.unlink(partId, siteId);
        return ResponseEntity.noContent().build();
    }

    // ---- Site -> Parts ------------------------------------------------------

    @GetMapping("/sites/{siteId}/parts")
    public PageResponse<PartResponse> partsOfSite(
            @PathVariable Long siteId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, PartController.SORT_FIELDS, PartController.DEFAULT_SORT);
        return partSiteService.partsOfSite(siteId, search, pageable);
    }

    @GetMapping("/sites/{siteId}/parts/candidates")
    public PageResponse<PartResponse> partCandidates(
            @PathVariable Long siteId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, PartController.SORT_FIELDS, PartController.DEFAULT_SORT);
        return partSiteService.partCandidates(siteId, search, pageable);
    }

    @PostMapping("/sites/{siteId}/parts/{partId}")
    public ResponseEntity<Void> linkFromSite(@PathVariable Long siteId, @PathVariable Long partId) {
        partSiteService.link(partId, siteId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/sites/{siteId}/parts/{partId}")
    public ResponseEntity<Void> unlinkFromSite(@PathVariable Long siteId, @PathVariable Long partId) {
        partSiteService.unlink(partId, siteId);
        return ResponseEntity.noContent().build();
    }
}
