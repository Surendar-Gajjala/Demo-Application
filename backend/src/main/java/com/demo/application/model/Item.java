package com.demo.application.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/** Item master data. BOM edges are navigated through ItemBomRepository, not mapped here. */
@Entity
@Table(name = "item")
public class Item extends BaseEntity {

    @Column(name = "item_number", nullable = false, length = 50)
    private String itemNumber;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ItemType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "life_cycle_phase", nullable = false, length = 20)
    private LifeCyclePhase lifeCyclePhase;

    @Column(name = "product_family", length = 100)
    private String productFamily;

    public String getItemNumber() {
        return itemNumber;
    }

    public void setItemNumber(String itemNumber) {
        this.itemNumber = itemNumber;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public LifeCyclePhase getLifeCyclePhase() {
        return lifeCyclePhase;
    }

    public void setLifeCyclePhase(LifeCyclePhase lifeCyclePhase) {
        this.lifeCyclePhase = lifeCyclePhase;
    }

    public String getProductFamily() {
        return productFamily;
    }

    public void setProductFamily(String productFamily) {
        this.productFamily = productFamily;
    }
}
