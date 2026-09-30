package com.demo.application.controller;

import java.util.List;

import com.demo.application.dto.BomLinkRequest;
import com.demo.application.dto.BomNodeResponse;
import com.demo.application.dto.BomUpdateRequest;
import com.demo.application.dto.ItemResponse;
import com.demo.application.dto.PageResponse;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.service.BomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/items")
public class BomController {

    private final BomService bomService;

    public BomController(BomService bomService) {
        this.bomService = bomService;
    }

    @GetMapping("/bom-roots")
    public PageResponse<BomNodeResponse> roots(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) LifeCyclePhase lifeCyclePhase,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, ItemController.SORT_FIELDS, ItemController.DEFAULT_SORT);
        return bomService.roots(search, type, lifeCyclePhase, pageable);
    }

    @GetMapping("/{id}/bom")
    public BomNodeResponse explode(@PathVariable Long id, @RequestParam(required = false) Integer maxDepth) {
        return bomService.explode(id, maxDepth);
    }

    @GetMapping("/{id}/bom/children")
    public List<BomNodeResponse> children(@PathVariable Long id) {
        return bomService.children(id);
    }

    @GetMapping("/{id}/bom/where-used")
    public BomNodeResponse whereUsed(@PathVariable Long id, @RequestParam(required = false) Integer maxDepth) {
        return bomService.whereUsed(id, maxDepth);
    }

    @GetMapping("/{id}/bom/parents")
    public List<BomNodeResponse> parents(@PathVariable Long id) {
        return bomService.parents(id);
    }

    /** Items that can be added under {id}: not itself, not already a child, not an ancestor. */
    @GetMapping("/{id}/bom/candidates")
    public PageResponse<ItemResponse> candidates(
            @PathVariable Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, ItemController.SORT_FIELDS, ItemController.DEFAULT_SORT);
        return bomService.candidates(id, search, pageable);
    }

    @PostMapping("/{id}/bom")
    public ResponseEntity<BomNodeResponse> addChild(@PathVariable Long id, @Valid @RequestBody BomLinkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bomService.addChild(id, request));
    }

    @PutMapping("/{id}/bom/{bomId}")
    public BomNodeResponse updateLink(@PathVariable Long id, @PathVariable Long bomId,
                                      @Valid @RequestBody BomUpdateRequest request) {
        return bomService.updateLink(id, bomId, request);
    }

    @DeleteMapping("/{id}/bom/{bomId}")
    public ResponseEntity<Void> removeLink(@PathVariable Long id, @PathVariable Long bomId) {
        bomService.removeLink(id, bomId);
        return ResponseEntity.noContent().build();
    }
}
