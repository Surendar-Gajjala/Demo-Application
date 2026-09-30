package com.demo.application.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.demo.application.dto.BomLinkRequest;
import com.demo.application.dto.BomNodeResponse;
import com.demo.application.dto.BomUpdateRequest;
import com.demo.application.dto.ItemResponse;
import com.demo.application.dto.PageResponse;
import com.demo.application.exception.BadRequestException;
import com.demo.application.exception.BomCycleException;
import com.demo.application.exception.ConflictException;
import com.demo.application.exception.NotFoundException;
import com.demo.application.mapper.BomMapper;
import com.demo.application.mapper.ItemMapper;
import com.demo.application.model.Item;
import com.demo.application.model.ItemBom;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.repository.ItemBomRepository;
import com.demo.application.repository.ItemRepository;
import com.demo.application.repository.ItemSpecifications;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Graph Query / BOM service: traversal over item nodes and item_bom edges, plus edge maintenance. */
@Service
public class BomService {

    public static final int DEFAULT_MAX_DEPTH = 10;
    public static final int MAX_DEPTH_LIMIT = 20;

    private final ItemRepository itemRepository;
    private final ItemBomRepository bomRepository;

    public BomService(ItemRepository itemRepository, ItemBomRepository bomRepository) {
        this.itemRepository = itemRepository;
        this.bomRepository = bomRepository;
    }

    /** Multi-level BOM explosion rooted at the item. */
    @Transactional(readOnly = true)
    public BomNodeResponse explode(Long itemId, Integer maxDepth) {
        Item item = findItem(itemId);
        BomNodeResponse root = BomMapper.root(item, bomRepository.existsByFromNodeId(itemId));
        return BomTreeBuilder.build(root, bomRepository.explode(itemId, clampDepth(maxDepth)));
    }

    /** Direct children only (lazy loading one level at a time). */
    @Transactional(readOnly = true)
    public List<BomNodeResponse> children(Long itemId) {
        findItem(itemId);
        return bomRepository.explode(itemId, 1).stream().map(BomMapper::fromRow).toList();
    }

    /** Multi-level where-used rooted at the item, nested upward. */
    @Transactional(readOnly = true)
    public BomNodeResponse whereUsed(Long itemId, Integer maxDepth) {
        Item item = findItem(itemId);
        BomNodeResponse root = BomMapper.root(item, bomRepository.existsByToNodeId(itemId));
        return BomTreeBuilder.build(root, bomRepository.whereUsed(itemId, clampDepth(maxDepth)));
    }

    /** Direct parents only. */
    @Transactional(readOnly = true)
    public List<BomNodeResponse> parents(Long itemId) {
        findItem(itemId);
        return bomRepository.whereUsed(itemId, 1).stream().map(BomMapper::fromRow).toList();
    }

    /** Top-level rows of the hierarchy: items with children and no parent. */
    @Transactional(readOnly = true)
    public PageResponse<BomNodeResponse> roots(String search, ItemType type, LifeCyclePhase lifeCyclePhase,
                                               Pageable pageable) {
        var spec = ItemSpecifications.matching(search, type, lifeCyclePhase).and(ItemSpecifications.isBomRoot());
        return PageResponse.of(itemRepository.findAll(spec, pageable), item -> BomMapper.root(item, true));
    }

    /**
     * Items that can be added as a child of parentId: matches search, and is not
     * the parent, not already a direct child, and not an ancestor (would be a cycle).
     */
    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> candidates(Long parentId, String search, Pageable pageable) {
        findItem(parentId);
        Set<Long> excluded = new HashSet<>(bomRepository.findAncestorIds(parentId));
        excluded.add(parentId);
        var spec = ItemSpecifications.matching(search, null, null)
                .and(ItemSpecifications.notChildOf(parentId))
                .and(ItemSpecifications.excludingIds(excluded));
        return PageResponse.of(itemRepository.findAll(spec, pageable), ItemMapper::toResponse);
    }

    @Transactional
    public BomNodeResponse addChild(Long parentId, BomLinkRequest request) {
        Item parent = findItem(parentId);
        Long childId = request.childId();
        if (childId.equals(parentId)) {
            throw new BadRequestException("An item cannot be added to its own BOM");
        }
        Item child = findItem(childId);
        if (bomRepository.existsByFromNodeIdAndToNodeId(parentId, childId)) {
            throw new ConflictException(child.getItemNumber() + " is already in the BOM of " + parent.getItemNumber());
        }
        if (bomRepository.isSelfOrAncestor(childId, parentId)) {
            throw new BomCycleException("Adding " + child.getItemNumber() + " under " + parent.getItemNumber()
                    + " would create a cycle: " + child.getItemNumber() + " is already an ancestor of "
                    + parent.getItemNumber());
        }

        ItemBom edge = new ItemBom();
        edge.setFromNode(parent);
        edge.setToNode(child);
        edge.setQuantity(request.quantity());
        edge.setSequence(request.sequence() == null ? ItemBom.DEFAULT_SEQUENCE : request.sequence());
        edge = bomRepository.saveAndFlush(edge);
        return BomMapper.childOf(edge, bomRepository.existsByFromNodeId(childId));
    }

    @Transactional
    public BomNodeResponse updateLink(Long parentId, Long bomId, BomUpdateRequest request) {
        ItemBom edge = findEdge(parentId, bomId);
        edge.setQuantity(request.quantity());
        edge.setSequence(request.sequence());
        edge = bomRepository.saveAndFlush(edge);
        return BomMapper.childOf(edge, bomRepository.existsByFromNodeId(edge.getToNode().getId()));
    }

    /** Removes the edge only; both items stay. */
    @Transactional
    public void removeLink(Long parentId, Long bomId) {
        bomRepository.delete(findEdge(parentId, bomId));
    }

    static int clampDepth(Integer maxDepth) {
        if (maxDepth == null) {
            return DEFAULT_MAX_DEPTH;
        }
        return Math.min(Math.max(maxDepth, 1), MAX_DEPTH_LIMIT);
    }

    private Item findItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> NotFoundException.of("Item", id));
    }

    private ItemBom findEdge(Long parentId, Long bomId) {
        return bomRepository.findByIdAndFromNodeId(bomId, parentId)
                .orElseThrow(() -> new NotFoundException("BOM link " + bomId + " not found under item " + parentId));
    }
}
