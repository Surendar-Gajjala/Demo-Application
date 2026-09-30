package com.demo.application.mapper;

import java.util.ArrayList;

import com.demo.application.dto.BomNodeResponse;
import com.demo.application.model.Item;
import com.demo.application.model.ItemBom;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.repository.BomRow;

public final class BomMapper {

    private BomMapper() {
    }

    /** Root of a traversal: no edge, level 0. */
    public static BomNodeResponse root(Item item, boolean hasChildren) {
        return new BomNodeResponse(null, item.getId(), item.getItemNumber(), item.getItemName(),
                item.getDescription(), item.getType(), item.getLifeCyclePhase(),
                null, null, 0, hasChildren, new ArrayList<>());
    }

    public static BomNodeResponse fromRow(BomRow row) {
        return new BomNodeResponse(row.getBomId(), row.getItemId(), row.getItemNumber(), row.getItemName(),
                row.getDescription(), ItemType.valueOf(row.getType()),
                LifeCyclePhase.valueOf(row.getLifeCyclePhase()),
                row.getQuantity(), row.getSequence(), row.getLevel(),
                Boolean.TRUE.equals(row.getHasChildren()), new ArrayList<>());
    }

    /** A single edge seen from its parent: the child item at level 1. */
    public static BomNodeResponse childOf(ItemBom edge, boolean childHasChildren) {
        Item child = edge.getToNode();
        return new BomNodeResponse(edge.getId(), child.getId(), child.getItemNumber(), child.getItemName(),
                child.getDescription(), child.getType(), child.getLifeCyclePhase(),
                edge.getQuantity(), edge.getSequence(), 1, childHasChildren, new ArrayList<>());
    }
}
