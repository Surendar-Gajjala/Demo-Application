package com.demo.application.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BomUpdateRequest(
        @NotNull @Positive @Digits(integer = 9, fraction = 3) BigDecimal quantity,
        @NotNull Integer sequence) {
}
