package com.demo.application.controller;

import java.util.Set;

import com.demo.application.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/**
 * Builds a {@link PageRequest} from raw query params: 0-based page, size
 * clamped to 1..{@value #MAX_SIZE}, and a single {@code field,asc|desc} sort
 * restricted to a whitelist.
 */
public final class PageRequestFactory {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PageRequestFactory() {
    }

    public static PageRequest of(Integer page, Integer size, String sort,
                                 Set<String> allowedSortFields, Sort defaultSort) {
        int p = page == null ? 0 : Math.max(page, 0);
        int s = size == null ? DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);
        return PageRequest.of(p, s, parseSort(sort, allowedSortFields, defaultSort));
    }

    static Sort parseSort(String sort, Set<String> allowedSortFields, Sort defaultSort) {
        if (sort == null || sort.isBlank()) {
            return defaultSort;
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        if (!allowedSortFields.contains(field)) {
            throw new BadRequestException(
                    "Unsupported sort field '" + field + "'. Allowed: " + allowedSortFields);
        }
        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length > 1) {
            direction = Sort.Direction.fromOptionalString(parts[1].trim())
                    .orElseThrow(() -> new BadRequestException(
                            "Unsupported sort direction '" + parts[1].trim() + "'. Use asc or desc"));
        }
        return Sort.by(direction, field);
    }
}
