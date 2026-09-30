package com.demo.application.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Adds childId under the item in the path. sequence defaults to 10. */
public record BomLinkRequest(
        @NotNull Long childId,
        @NotNull @Positive @Digits(integer = 9, fraction = 3) BigDecimal quantity,
        Integer sequence) {
}
