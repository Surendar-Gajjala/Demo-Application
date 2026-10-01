package com.demo.application.repository;

import com.demo.application.model.LifeCyclePhase;
import com.demo.application.model.Part;
import com.demo.application.model.PartSite;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

public final class PartSpecifications {

    private PartSpecifications() {
    }

    /** search on partNumber OR partName, AND-ed with the optional lifecycle filter. */
    public static Specification<Part> matching(String search, LifeCyclePhase lifeCyclePhase) {
        return Specification.where(SearchSpecifications.<Part>containsIgnoreCase(search, "partNumber", "partName"))
                .and(SearchSpecifications.equalsIfPresent("lifeCyclePhase", lifeCyclePhase));
    }

    /** Parts whose parent item is itemId. */
    public static Specification<Part> belongsToItem(Long itemId) {
        return (root, query, cb) -> cb.equal(root.get("item").get("id"), itemId);
    }

    /** Parts without a parent item. */
    public static Specification<Part> unassigned() {
        return (root, query, cb) -> cb.isNull(root.get("item"));
    }

    /** Parts linked to siteId through part_site. */
    public static Specification<Part> linkedToSite(Long siteId) {
        return (root, query, cb) -> cb.exists(linkTo(root, query, cb, siteId));
    }

    /** Parts not yet linked to siteId. */
    public static Specification<Part> notLinkedToSite(Long siteId) {
        return (root, query, cb) -> cb.not(cb.exists(linkTo(root, query, cb, siteId)));
    }

    private static Subquery<Long> linkTo(Root<Part> root, CriteriaQuery<?> query, CriteriaBuilder cb, Long siteId) {
        Subquery<Long> link = query.subquery(Long.class);
        Root<PartSite> ps = link.from(PartSite.class);
        link.select(ps.get("id")).where(
                cb.equal(ps.get("site").get("id"), siteId),
                cb.equal(ps.get("part"), root));
        return link;
    }
}
