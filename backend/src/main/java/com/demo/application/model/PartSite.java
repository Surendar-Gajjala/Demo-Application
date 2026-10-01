package com.demo.application.model;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/** Part N : N Site link. No updated_at, so it does not extend BaseEntity. */
@Entity
@Table(name = "part_site")
public class PartSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected PartSite() {
    }

    public PartSite(Part part, Site site) {
        this.part = part;
        this.site = site;
    }

    public Long getId() {
        return id;
    }

    public Part getPart() {
        return part;
    }

    public Site getSite() {
        return site;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
