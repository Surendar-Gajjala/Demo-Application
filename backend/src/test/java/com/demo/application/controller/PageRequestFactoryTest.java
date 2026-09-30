package com.demo.application.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;

import com.demo.application.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class PageRequestFactoryTest {

    private static final Set<String> ALLOWED = Set.of("name", "createdAt");
    private static final Sort DEFAULT = Sort.by("name");

    @Test
    void defaultsWhenParamsMissing() {
        PageRequest pr = PageRequestFactory.of(null, null, null, ALLOWED, DEFAULT);
        assertThat(pr.getPageNumber()).isZero();
        assertThat(pr.getPageSize()).isEqualTo(20);
        assertThat(pr.getSort()).isEqualTo(DEFAULT);
    }

    @Test
    void clampsPageAndSize() {
        assertThat(PageRequestFactory.of(-3, 500, null, ALLOWED, DEFAULT).getPageSize()).isEqualTo(100);
        assertThat(PageRequestFactory.of(-3, 0, null, ALLOWED, DEFAULT).getPageSize()).isEqualTo(1);
        assertThat(PageRequestFactory.of(-3, 10, null, ALLOWED, DEFAULT).getPageNumber()).isZero();
    }

    @Test
    void parsesFieldAndDirection() {
        Sort sort = PageRequestFactory.of(0, 10, "createdAt,desc", ALLOWED, DEFAULT).getSort();
        assertThat(sort).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
        assertThat(PageRequestFactory.of(0, 10, "name", ALLOWED, DEFAULT).getSort())
                .isEqualTo(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Test
    void rejectsUnknownFieldOrDirection() {
        assertThatThrownBy(() -> PageRequestFactory.of(0, 10, "password,asc", ALLOWED, DEFAULT))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("password");
        assertThatThrownBy(() -> PageRequestFactory.of(0, 10, "name,sideways", ALLOWED, DEFAULT))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sideways");
    }
}
