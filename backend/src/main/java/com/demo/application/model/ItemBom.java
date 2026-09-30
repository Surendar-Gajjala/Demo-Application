package com.demo.application.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** BOM edge: fromNode (parent) -> toNode (child). */
@Entity
@Table(name = "item_bom")
public class ItemBom extends BaseEntity {

    public static final int DEFAULT_SEQUENCE = 10;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_node_id", nullable = false)
    private Item fromNode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_node_id", nullable = false)
    private Item toNode;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    /** Informational only; real levels come from traversal. */
    @Column(name = "bom_depth", nullable = false)
    private int bomDepth = 1;

    @Column(name = "sequence", nullable = false)
    private int sequence = DEFAULT_SEQUENCE;

    public Item getFromNode() {
        return fromNode;
    }

    public void setFromNode(Item fromNode) {
        this.fromNode = fromNode;
    }

    public Item getToNode() {
        return toNode;
    }

    public void setToNode(Item toNode) {
        this.toNode = toNode;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public int getBomDepth() {
        return bomDepth;
    }

    public void setBomDepth(int bomDepth) {
        this.bomDepth = bomDepth;
    }

    public int getSequence() {
        return sequence;
    }

    public void setSequence(int sequence) {
        this.sequence = sequence;
    }
}
