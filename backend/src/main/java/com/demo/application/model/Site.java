package com.demo.application.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "site")
public class Site extends BaseEntity {

    @Column(name = "site_name", nullable = false)
    private String siteName;

    @Column(name = "site_type", length = 100)
    private String siteType;

    @Column(name = "workcenter", length = 100)
    private String workcenter;

    @Column(name = "address", columnDefinition = "text")
    private String address;

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getSiteType() {
        return siteType;
    }

    public void setSiteType(String siteType) {
        this.siteType = siteType;
    }

    public String getWorkcenter() {
        return workcenter;
    }

    public void setWorkcenter(String workcenter) {
        this.workcenter = workcenter;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
