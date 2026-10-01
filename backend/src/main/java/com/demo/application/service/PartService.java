package com.demo.application.service;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartRequest;
import com.demo.application.dto.PartResponse;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.PartMapper;
import com.demo.application.model.Item;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.model.Part;
import com.demo.application.repository.ItemRepository;
import com.demo.application.repository.PartRepository;
import com.demo.application.repository.PartSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartService {

    private final PartRepository partRepository;
    private final ItemRepository itemRepository;

    public PartService(PartRepository partRepository, ItemRepository itemRepository) {
        this.partRepository = partRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PartResponse> search(String search, LifeCyclePhase lifeCyclePhase, Pageable pageable) {
        return PageResponse.of(partRepository.findAll(PartSpecifications.matching(search, lifeCyclePhase), pageable),
                PartMapper::toResponse);
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
        part.setItem(findItemOrNull(request.itemId()));
        return PartMapper.toResponse(partRepository.saveAndFlush(part));
    }

    @Transactional
    public PartResponse update(Long id, PartRequest request) {
        Part part = find(id);
        if (partRepository.existsByPartNumberAndIdNot(request.partNumber().trim(), id)) {
            throw duplicate(request.partNumber());
        }
        PartMapper.apply(request, part);
        part.setItem(findItemOrNull(request.itemId()));
        return PartMapper.toResponse(partRepository.saveAndFlush(part));
    }

    @Transactional
    public void delete(Long id) {
        partRepository.delete(find(id));
    }

    private Part find(Long id) {
        return partRepository.findById(id).orElseThrow(() -> NotFoundException.of("Part", id));
    }

    /** Optional parent item; an unknown id is a 404. */
    private Item findItemOrNull(Long itemId) {
        if (itemId == null) {
            return null;
        }
        return itemRepository.findById(itemId).orElseThrow(() -> NotFoundException.of("Item", itemId));
    }

    private static ConflictException duplicate(String partNumber) {
        return new ConflictException("Part number '" + partNumber.trim() + "' already exists");
    }
}
