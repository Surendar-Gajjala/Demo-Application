package com.demo.application.dto;

import java.math.BigDecimal;
import java.util.List;

import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;

/**
 * One node of a BOM tree (explosion or where-used).
 *
 * @param bomId       edge id; null for the root node
 * @param quantity    edge quantity; null for the root node
 * @param sequence    edge sequence; null for the root node
 * @param level       0 = root, 1 = direct child/parent, ...
 * @param hasChildren true if the item has further edges in the traversal direction
 * @param children    nested nodes; empty for flat responses (/children, /parents, roots)
 */
public record BomNodeResponse(
        Long bomId,
        Long itemId,
        String itemNumber,
        String itemName,
        String description,
        ItemType type,
        LifeCyclePhase lifeCyclePhase,
        BigDecimal quantity,
        Integer sequence,
        int level,
        boolean hasChildren,
        List<BomNodeResponse> children) {
}
