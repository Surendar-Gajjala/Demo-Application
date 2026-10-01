package com.demo.application.repository;

import com.demo.application.model.Part;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PartRepository extends JpaRepository<Part, Long>, JpaSpecificationExecutor<Part> {

    boolean existsByPartNumber(String partNumber);

    boolean existsByPartNumberAndIdNot(String partNumber, Long id);

    /** Fetches the parent item in the same query (responses include its number and name). */
    @Override
    @EntityGraph(attributePaths = "item")
    Page<Part> findAll(Specification<Part> spec, Pageable pageable);
}
