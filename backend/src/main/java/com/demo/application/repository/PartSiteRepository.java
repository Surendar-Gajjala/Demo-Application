package com.demo.application.repository;

import java.util.Optional;

import com.demo.application.model.PartSite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartSiteRepository extends JpaRepository<PartSite, Long> {

    boolean existsByPartIdAndSiteId(Long partId, Long siteId);

    Optional<PartSite> findByPartIdAndSiteId(Long partId, Long siteId);
}
