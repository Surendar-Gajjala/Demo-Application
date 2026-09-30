package com.demo.application.repository;

import java.util.Locale;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

/** Reusable building blocks for search/filter specifications. */
public final class SearchSpecifications {

    private SearchSpecifications() {
    }

    /**
     * Case-insensitive "contains" on any of the given attributes
     * ({@code lower(col) LIKE '%term%'}), matching the trigram indexes.
     * Blank term = no restriction.
     */
    public static <T> Specification<T> containsIgnoreCase(String term, String... attributes) {
        if (term == null || term.isBlank()) {
            return null;
        }
        String pattern = "%" + escapeLike(term.trim().toLowerCase(Locale.ROOT)) + "%";
        return (root, query, cb) -> {
            Predicate[] ors = new Predicate[attributes.length];
            for (int i = 0; i < attributes.length; i++) {
                ors[i] = cb.like(cb.lower(root.get(attributes[i])), pattern, '\\');
            }
            return cb.or(ors);
        };
    }

    /** Exact match; null or blank value = no restriction. */
    public static <T> Specification<T> equalsIfPresent(String attribute, Object value) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get(attribute), value);
    }

    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
