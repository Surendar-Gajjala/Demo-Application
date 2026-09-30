package com.demo.application.service;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartRequest;
import com.demo.application.dto.PartResponse;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.PartMapper;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.model.Part;
import com.demo.application.repository.PartRepository;
import com.demo.application.repository.SearchSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PartResponse> search(String search, LifeCyclePhase lifeCyclePhase, Pageable pageable) {
        Specification<Part> spec = Specification
                .where(SearchSpecifications.<Part>containsIgnoreCase(search, "partNumber", "partName"))
                .and(SearchSpecifications.equalsIfPresent("lifeCyclePhase", lifeCyclePhase));
        return PageResponse.of(partRepository.findAll(spec, pageable), PartMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PartResponse get(Long id) {
        return PartMapper.toResponse(find(id));
    }

    @Transactional
    public PartResponse create(PartRequest request) {
        if (partRepository.existsByPartNumber(request.partNumber().trim())) {
            throw duplicate(request.partNumber());
        }
        Part part = new Part();
        PartMapper.apply(request, part);
        return PartMapper.toResponse(partRepository.saveAndFlush(part));
    }

    @Transactional
    public PartResponse update(Long id, PartRequest request) {
        Part part = find(id);
        if (partRepository.existsByPartNumberAndIdNot(request.partNumber().trim(), id)) {
            throw duplicate(request.partNumber());
        }
        PartMapper.apply(request, part);
        return PartMapper.toResponse(partRepository.saveAndFlush(part));
    }

    @Transactional
    public void delete(Long id) {
        partRepository.delete(find(id));
    }

    private Part find(Long id) {
        return partRepository.findById(id).orElseThrow(() -> NotFoundException.of("Part", id));
    }

    private static ConflictException duplicate(String partNumber) {
        return new ConflictException("Part number '" + partNumber.trim() + "' already exists");
    }
}
