package com.demo.application.service;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.SiteRequest;
import com.demo.application.dto.SiteResponse;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.SiteMapper;
import com.demo.application.model.Site;
import com.demo.application.repository.SearchSpecifications;
import com.demo.application.repository.SiteRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteService {

    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SiteResponse> search(String search, String siteType, Pageable pageable) {
        Specification<Site> spec = Specification
                .where(SearchSpecifications.<Site>containsIgnoreCase(search, "siteName"))
                .and(SearchSpecifications.equalsIfPresent("siteType", siteType));
        return PageResponse.of(siteRepository.findAll(spec, pageable), SiteMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public SiteResponse get(Long id) {
        return SiteMapper.toResponse(find(id));
    }

    @Transactional
    public SiteResponse create(SiteRequest request) {
        Site site = new Site();
        SiteMapper.apply(request, site);
        return SiteMapper.toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public SiteResponse update(Long id, SiteRequest request) {
        Site site = find(id);
        SiteMapper.apply(request, site);
        return SiteMapper.toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public void delete(Long id) {
        siteRepository.delete(find(id));
    }

    private Site find(Long id) {
        return siteRepository.findById(id).orElseThrow(() -> NotFoundException.of("Site", id));
    }
}
