package com.demo.application.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.demo.application.AbstractPostgresIT;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

class PartSiteApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate jdbc;

    static String suffix() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    long newPart(String number) throws Exception {
        String body = mvc.perform(post("/api/parts").contentType(MediaType.APPLICATION_JSON)
                        .content(PartApiIT.partJson(number, "Part site test", "DESIGN")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    long newSite(String name) throws Exception {
        String body = mvc.perform(post("/api/sites").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"siteName\":\"" + name + "\",\"siteType\":\"Plant\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    long partLinks(long partId) {
        return jdbc.queryForObject("SELECT count(*) FROM part_site WHERE part_id = ?", Long.class, partId);
    }

    long siteLinks(long siteId) {
        return jdbc.queryForObject("SELECT count(*) FROM part_site WHERE site_id = ?", Long.class, siteId);
    }

    @Test
    void seedLinksAreVisibleFromBothSides() throws Exception {
        long a2041 = jdbc.queryForObject("SELECT id FROM part WHERE part_number = 'A-2041'", Long.class);
        long hyderabad = jdbc.queryForObject("SELECT id FROM site WHERE site_name = 'Hyderabad Plant'", Long.class);

        mvc.perform(get("/api/parts/" + a2041 + "/sites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].siteName", hasItem("Hyderabad Plant")));
        mvc.perform(get("/api/sites/" + hyderabad + "/parts").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].partNumber", hasItem("A-2041")))
                .andExpect(jsonPath("$.content[?(@.partNumber == 'A-2041')].itemNumber").value(hasItem("PROD-001")));
    }

    @Test
    void linkFromPartSeenFromSiteThenUnlinkFromSite() throws Exception {
        String number = "PST-" + suffix();
        String siteName = "PST Site " + suffix();
        long part = newPart(number);
        long site = newSite(siteName);

        mvc.perform(get("/api/parts/" + part + "/sites/candidates").param("search", siteName))
                .andExpect(jsonPath("$.content[*].siteName", containsInAnyOrder(siteName)));

        mvc.perform(post("/api/parts/" + part + "/sites/" + site)).andExpect(status().isCreated());
        // The same link, made from the other side, is a duplicate.
        mvc.perform(post("/api/sites/" + site + "/parts/" + part)).andExpect(status().isConflict());

        mvc.perform(get("/api/parts/" + part + "/sites"))
                .andExpect(jsonPath("$.content[*].siteName", containsInAnyOrder(siteName)));
        mvc.perform(get("/api/sites/" + site + "/parts"))
                .andExpect(jsonPath("$.content[*].partNumber", containsInAnyOrder(number)));

        // Linked records are no longer candidates on either side.
        mvc.perform(get("/api/parts/" + part + "/sites/candidates").param("search", siteName))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/sites/" + site + "/parts/candidates").param("size", "100"))
                .andExpect(jsonPath("$.content[*].partNumber", not(hasItem(number))));

        mvc.perform(delete("/api/sites/" + site + "/parts/" + part)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/parts/" + part + "/sites/" + site)).andExpect(status().isNotFound());
        mvc.perform(get("/api/sites/" + site + "/parts")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void deletingAPartOrSiteRemovesItsLinks() throws Exception {
        long part = newPart("PST-" + suffix());
        long site = newSite("PST Site " + suffix());
        long otherSite = newSite("PST Site " + suffix());
        mvc.perform(post("/api/parts/" + part + "/sites/" + site)).andExpect(status().isCreated());
        mvc.perform(post("/api/parts/" + part + "/sites/" + otherSite)).andExpect(status().isCreated());

        mvc.perform(delete("/api/sites/" + otherSite)).andExpect(status().isNoContent());
        assertThat(siteLinks(otherSite)).isZero();
        assertThat(partLinks(part)).isEqualTo(1);

        mvc.perform(delete("/api/parts/" + part)).andExpect(status().isNoContent());
        assertThat(partLinks(part)).isZero();
        assertThat(siteLinks(site)).isZero();
    }

    @Test
    void unknownPartOrSiteIs404() throws Exception {
        long site = newSite("PST Site " + suffix());
        mvc.perform(get("/api/parts/999999/sites")).andExpect(status().isNotFound());
        mvc.perform(get("/api/sites/999999/parts")).andExpect(status().isNotFound());
        mvc.perform(post("/api/parts/999999/sites/" + site)).andExpect(status().isNotFound());
        mvc.perform(post("/api/sites/999999/parts/1")).andExpect(status().isNotFound());
    }
}
