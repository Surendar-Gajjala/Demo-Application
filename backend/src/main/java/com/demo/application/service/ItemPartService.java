package com.demo.application.service;

import java.util.Objects;

import com.demo.application.dto.PageResponse;
import com.demo.application.dto.PartResponse;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.PartMapper;
import com.demo.application.model.Item;
import com.demo.application.model.Part;
import com.demo.application.repository.ItemRepository;
import com.demo.application.repository.PartRepository;
import com.demo.application.repository.PartSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Item 1 : N Part, stored as part.item_id. Attaching puts an existing part under the item. */
@Service
public class ItemPartService {

    private final ItemRepository itemRepository;
    private final PartRepository partRepository;

    public ItemPartService(ItemRepository itemRepository, PartRepository partRepository) {
        this.itemRepository = itemRepository;
        this.partRepository = partRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PartResponse> parts(Long itemId, String search, Pageable pageable) {
        findItem(itemId);
        var spec = PartSpecifications.matching(search, null).and(PartSpecifications.belongsToItem(itemId));
        return PageResponse.of(partRepository.findAll(spec, pageable), PartMapper::toResponse);
    }

    /** Parts that can be attached: those without a parent item (a part belongs to one item). */
    @Transactional(readOnly = true)
    public PageResponse<PartResponse> candidates(Long itemId, String search, Pageable pageable) {
        findItem(itemId);
        var spec = PartSpecifications.matching(search, null).and(PartSpecifications.unassigned());
        return PageResponse.of(partRepository.findAll(spec, pageable), PartMapper::toResponse);
    }

    @Transactional
    public PartResponse attach(Long itemId, Long partId) {
        Item item = findItem(itemId);
        Part part = findPart(partId);
        Item current = part.getItem();
        if (current != null) {
            throw new ConflictException(
                    "Part " + part.getPartNumber() + " already belongs to " + current.getItemNumber());
        }
        part.setItem(item);
        return PartMapper.toResponse(partRepository.saveAndFlush(part));
    }

    /** Unlinks the part from the item; the part itself is kept. */
    @Transactional
    public void detach(Long itemId, Long partId) {
        Item item = findItem(itemId);
        Part part = findPart(partId);
        if (part.getItem() == null || !Objects.equals(part.getItem().getId(), itemId)) {
            throw new NotFoundException(
                    "Part " + part.getPartNumber() + " does not belong to " + item.getItemNumber());
        }
        part.setItem(null);
        partRepository.saveAndFlush(part);
    }

    private Item findItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> NotFoundException.of("Item", id));
    }

    private Part findPart(Long id) {
        return partRepository.findById(id).orElseThrow(() -> NotFoundException.of("Part", id));
    }
}
