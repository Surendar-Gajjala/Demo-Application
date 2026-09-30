package com.demo.application.controller;

import java.net.URI;
import java.util.Set;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.SiteRequest;
import com.demo.application.dto.SiteResponse;
import com.demo.application.service.SiteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    static final Set<String> SORT_FIELDS = Set.of("siteName", "siteType", "workcenter", "createdAt", "updatedAt");
    static final Sort DEFAULT_SORT = Sort.by("siteName");

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public PageResponse<SiteResponse> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String siteType,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, SORT_FIELDS, DEFAULT_SORT);
        return siteService.search(search, siteType, pageable);
    }

    @GetMapping("/{id}")
    public SiteResponse get(@PathVariable Long id) {
        return siteService.get(id);
    }

    @PostMapping
    public ResponseEntity<SiteResponse> create(@Valid @RequestBody SiteRequest request) {
        SiteResponse created = siteService.create(request);
        return ResponseEntity.created(URI.create("/api/sites/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public SiteResponse update(@PathVariable Long id, @Valid @RequestBody SiteRequest request) {
        return siteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        siteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
