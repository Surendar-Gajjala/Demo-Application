package com.demo.application.dto;

import jakarta.validation.constraints.NotNull;

/** Body of POST /api/items/{itemId}/parts: the existing part to attach. */
public record LinkPartRequest(@NotNull Long partId) {
}
