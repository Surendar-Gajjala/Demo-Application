package com.demo.application.repository;

import com.demo.application.model.PartSite;
import com.demo.application.model.Site;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

public final class SiteSpecifications {

    private SiteSpecifications() {
    }

    /** Case-insensitive "contains" on siteName (same as the Sites list). */
    public static Specification<Site> matching(String search) {
        return Specification.where(SearchSpecifications.<Site>containsIgnoreCase(search, "siteName"));
    }

    /** Sites linked to partId through part_site. */
    public static Specification<Site> linkedToPart(Long partId) {
        return (root, query, cb) -> cb.exists(linkTo(root, query, cb, partId));
    }

    /** Sites not yet linked to partId. */
    public static Specification<Site> notLinkedToPart(Long partId) {
        return (root, query, cb) -> cb.not(cb.exists(linkTo(root, query, cb, partId)));
    }

    private static Subquery<Long> linkTo(Root<Site> root, CriteriaQuery<?> query, CriteriaBuilder cb, Long partId) {
        Subquery<Long> link = query.subquery(Long.class);
        Root<PartSite> ps = link.from(PartSite.class);
        link.select(ps.get("id")).where(
                cb.equal(ps.get("part").get("id"), partId),
                cb.equal(ps.get("site"), root));
        return link;
    }
}
