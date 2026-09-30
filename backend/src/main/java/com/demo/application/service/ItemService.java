package com.demo.application.service;

import com.demo.application.dto.ItemRequest;
import com.demo.application.dto.ItemResponse;
import com.demo.application.dto.PageResponse;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.ItemMapper;
import com.demo.application.model.Item;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.repository.ItemRepository;
import com.demo.application.repository.ItemSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> search(String search, ItemType type, LifeCyclePhase lifeCyclePhase,
                                             Pageable pageable) {
        var spec = ItemSpecifications.matching(search, type, lifeCyclePhase);
        return PageResponse.of(itemRepository.findAll(spec, pageable), ItemMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ItemResponse get(Long id) {
        return ItemMapper.toResponse(find(id));
    }

    @Transactional
    public ItemResponse create(ItemRequest request) {
        if (itemRepository.existsByItemNumber(request.itemNumber().trim())) {
            throw duplicate(request.itemNumber());
        }
        Item item = new Item();
        ItemMapper.apply(request, item);
        return ItemMapper.toResponse(itemRepository.saveAndFlush(item));
    }

    @Transactional
    public ItemResponse update(Long id, ItemRequest request) {
        Item item = find(id);
        if (itemRepository.existsByItemNumberAndIdNot(request.itemNumber().trim(), id)) {
            throw duplicate(request.itemNumber());
        }
        ItemMapper.apply(request, item);
        return ItemMapper.toResponse(itemRepository.saveAndFlush(item));
    }

    /** Deletes the item; its BOM edges are removed by ON DELETE CASCADE. */
    @Transactional
    public void delete(Long id) {
        itemRepository.delete(find(id));
    }

    Item find(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> NotFoundException.of("Item", id));
    }

    private static ConflictException duplicate(String itemNumber) {
        return new ConflictException("Item number '" + itemNumber.trim() + "' already exists");
    }
}
