package com.demo.application.controller;

import com.demo.application.dto.LinkPartRequest;
import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartResponse;
import com.demo.application.service.ItemPartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Item 1 : N Part. */
@RestController
@RequestMapping("/api/items/{itemId}/parts")
public class ItemPartController {

    private final ItemPartService itemPartService;

    public ItemPartController(ItemPartService itemPartService) {
        this.itemPartService = itemPartService;
    }

    @GetMapping
    public PageResponse<PartResponse> parts(
            @PathVariable Long itemId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, PartController.SORT_FIELDS, PartController.DEFAULT_SORT);
        return itemPartService.parts(itemId, search, pageable);
    }

    /** Parts that can be attached to the item (not assigned to any item). */
    @GetMapping("/candidates")
    public PageResponse<PartResponse> candidates(
            @PathVariable Long itemId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        var pageable = PageRequestFactory.of(page, size, sort, PartController.SORT_FIELDS, PartController.DEFAULT_SORT);
        return itemPartService.candidates(itemId, search, pageable);
    }

    @PostMapping
    public ResponseEntity<PartResponse> attach(@PathVariable Long itemId, @Valid @RequestBody LinkPartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemPartService.attach(itemId, request.partId()));
    }

    @DeleteMapping("/{partId}")
    public ResponseEntity<Void> detach(@PathVariable Long itemId, @PathVariable Long partId) {
        itemPartService.detach(itemId, partId);
        return ResponseEntity.noContent().build();
    }
}
