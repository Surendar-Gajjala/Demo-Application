package com.demo.application.mapper;

import com.demo.application.dto.ItemRequest;
import com.demo.application.dto.ItemResponse;
import com.demo.application.model.Item;

public final class ItemMapper {

    private ItemMapper() {
    }

    public static ItemResponse toResponse(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getItemNumber(),
                item.getItemName(),
                item.getDescription(),
                item.getType(),
                item.getLifeCyclePhase(),
                item.getProductFamily(),
                item.getCreatedAt(),
                item.getUpdatedAt());
    }

    /** Copies every request field onto the entity (create and full update). */
    public static void apply(ItemRequest request, Item item) {
        item.setItemNumber(request.itemNumber().trim());
        item.setItemName(request.itemName().trim());
        item.setDescription(request.description());
        item.setType(request.type());
        item.setLifeCyclePhase(request.lifeCyclePhase());
        item.setProductFamily(request.productFamily());
    }
}
