package com.demo.application.service;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartResponse;
import com.demo.application.dto.SiteResponse;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.PartMapper;
import com.demo.application.mapper.SiteMapper;
import com.demo.application.model.Part;
import com.demo.application.model.PartSite;
import com.demo.application.model.Site;
import com.demo.application.repository.PartRepository;
import com.demo.application.repository.PartSiteRepository;
import com.demo.application.repository.PartSpecifications;
import com.demo.application.repository.SiteRepository;
import com.demo.application.repository.SiteSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Part N : N Site (part_site). One service for both directions, so the link
 * is the same whether it is made from the Part page or the Site page.
 */
@Service
public class PartSiteService {

    private final PartRepository partRepository;
    private final SiteRepository siteRepository;
    private final PartSiteRepository partSiteRepository;

    public PartSiteService(PartRepository partRepository, SiteRepository siteRepository,
                           PartSiteRepository partSiteRepository) {
        this.partRepository = partRepository;
        this.siteRepository = siteRepository;
        this.partSiteRepository = partSiteRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SiteResponse> sitesOfPart(Long partId, String search, Pageable pageable) {
        findPart(partId);
        var spec = SiteSpecifications.matching(search).and(SiteSpecifications.linkedToPart(partId));
        return PageResponse.of(siteRepository.findAll(spec, pageable), SiteMapper::toResponse);
    }

    /** Sites the part is not linked to yet. */
    @Transactional(readOnly = true)
    public PageResponse<SiteResponse> siteCandidates(Long partId, String search, Pageable pageable) {
        findPart(partId);
        var spec = SiteSpecifications.matching(search).and(SiteSpecifications.notLinkedToPart(partId));
        return PageResponse.of(siteRepository.findAll(spec, pageable), SiteMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<PartResponse> partsOfSite(Long siteId, String search, Pageable pageable) {
        findSite(siteId);
        var spec = PartSpecifications.matching(search, null).and(PartSpecifications.linkedToSite(siteId));
        return PageResponse.of(partRepository.findAll(spec, pageable), PartMapper::toResponse);
    }

    /** Parts not linked to the site yet. */
    @Transactional(readOnly = true)
    public PageResponse<PartResponse> partCandidates(Long siteId, String search, Pageable pageable) {
        findSite(siteId);
        var spec = PartSpecifications.matching(search, null).and(PartSpecifications.notLinkedToSite(siteId));
        return PageResponse.of(partRepository.findAll(spec, pageable), PartMapper::toResponse);
    }

    @Transactional
    public void link(Long partId, Long siteId) {
        Part part = findPart(partId);
        Site site = findSite(siteId);
        if (partSiteRepository.existsByPartIdAndSiteId(partId, siteId)) {
            throw new ConflictException(
                    "Part " + part.getPartNumber() + " is already linked to " + site.getSiteName());
        }
        partSiteRepository.saveAndFlush(new PartSite(part, site));
    }

    @Transactional
    public void unlink(Long partId, Long siteId) {
        Part part = findPart(partId);
        Site site = findSite(siteId);
        PartSite link = partSiteRepository.findByPartIdAndSiteId(partId, siteId)
                .orElseThrow(() -> new NotFoundException(
                        "Part " + part.getPartNumber() + " is not linked to " + site.getSiteName()));
        partSiteRepository.delete(link);
    }

    private Part findPart(Long id) {
        return partRepository.findById(id).orElseThrow(() -> NotFoundException.of("Part", id));
    }

    private Site findSite(Long id) {
        return siteRepository.findById(id).orElseThrow(() -> NotFoundException.of("Site", id));
    }
}
