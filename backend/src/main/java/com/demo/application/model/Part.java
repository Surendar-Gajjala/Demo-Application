package com.demo.application.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "part")
public class Part extends BaseEntity {

    @Column(name = "part_number", nullable = false, length = 50)
    private String partNumber;

    @Column(name = "part_name", nullable = false)
    private String partName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "manufacture_name")
    private String manufactureName;

    @Enumerated(EnumType.STRING)
    @Column(name = "life_cycle_phase", nullable = false, length = 20)
    private LifeCyclePhase lifeCyclePhase;

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public String getPartName() {
        return partName;
    }

    public void setPartName(String partName) {
        this.partName = partName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getManufactureName() {
        return manufactureName;
    }

    public void setManufactureName(String manufactureName) {
        this.manufactureName = manufactureName;
    }

    public LifeCyclePhase getLifeCyclePhase() {
        return lifeCyclePhase;
    }

    public void setLifeCyclePhase(LifeCyclePhase lifeCyclePhase) {
        this.lifeCyclePhase = lifeCyclePhase;
    }
}
