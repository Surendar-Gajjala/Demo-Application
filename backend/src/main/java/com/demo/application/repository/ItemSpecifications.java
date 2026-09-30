package com.demo.application.repository;

import java.util.Collection;

import com.demo.application.model.Item;
import com.demo.application.model.ItemBom;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

public final class ItemSpecifications {

    private ItemSpecifications() {
    }

    /** search on itemNumber OR itemName, AND-ed with the optional filters. */
    public static Specification<Item> matching(String search, ItemType type, LifeCyclePhase lifeCyclePhase) {
        return Specification.where(SearchSpecifications.<Item>containsIgnoreCase(search, "itemNumber", "itemName"))
                .and(SearchSpecifications.equalsIfPresent("type", type))
                .and(SearchSpecifications.equalsIfPresent("lifeCyclePhase", lifeCyclePhase));
    }

    /** Items whose id is not in the given collection; empty collection = no restriction. */
    public static Specification<Item> excludingIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }
        return (root, query, cb) -> cb.not(root.get("id").in(ids));
    }

    /** Items that are not already a direct child of parentId. */
    public static Specification<Item> notChildOf(Long parentId) {
        return (root, query, cb) -> {
            Subquery<Long> edge = query.subquery(Long.class);
            Root<ItemBom> b = edge.from(ItemBom.class);
            edge.select(b.get("id")).where(
                    cb.equal(b.get("fromNode").get("id"), parentId),
                    cb.equal(b.get("toNode"), root));
            return cb.not(cb.exists(edge));
        };
    }

    /** Items that have at least one child and no parent: top-level rows of the hierarchy. */
    public static Specification<Item> isBomRoot() {
        return (root, query, cb) -> {
            Subquery<Long> asParent = query.subquery(Long.class);
            Root<ItemBom> down = asParent.from(ItemBom.class);
            asParent.select(down.get("id")).where(cb.equal(down.get("fromNode"), root));

            Subquery<Long> asChild = query.subquery(Long.class);
            Root<ItemBom> up = asChild.from(ItemBom.class);
            asChild.select(up.get("id")).where(cb.equal(up.get("toNode"), root));

            return cb.and(cb.exists(asParent), cb.not(cb.exists(asChild)));
        };
    }
}
