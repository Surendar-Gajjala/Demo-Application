package com.demo.application.controller;

import java.net.URI;
import java.util.Set;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartRequest;
import com.demo.application.dto.PartResponse;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.service.PartService;
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
@RequestMapping("/api/parts")
public class PartController {

    static final Set<String> SORT_FIELDS = Set.of(
            "partNumber", "partName", "manufactureName", "lifeCyclePhase", "createdAt", "updatedAt");
    static final Sort DEFAULT_SORT = Sort.by("partNumber");

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public PageResponse<PartResponse> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LifeCyclePhase lifeCyclePhase,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, SORT_FIELDS, DEFAULT_SORT);
        return partService.search(search, lifeCyclePhase, pageable);
    }

    @GetMapping("/{id}")
    public PartResponse get(@PathVariable Long id) {
        return partService.get(id);
    }

    @PostMapping
    public ResponseEntity<PartResponse> create(@Valid @RequestBody PartRequest request) {
        PartResponse created = partService.create(request);
        return ResponseEntity.created(URI.create("/api/parts/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PartResponse update(@PathVariable Long id, @Valid @RequestBody PartRequest request) {
        return partService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        partService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
