package com.demo.application.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.demo.application.AbstractPostgresIT;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class SiteApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void searchBySiteNameAndFilterByType() throws Exception {
        mvc.perform(get("/api/sites").param("search", "hyderabad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].siteName").value("Hyderabad Plant"))
                .andExpect(jsonPath("$.content[0].workcenter").value("WC-001"))
                .andExpect(jsonPath("$.content[0].address").value("Hyderabad, India"));

        mvc.perform(get("/api/sites").param("siteType", "Plant"))
                .andExpect(jsonPath("$.totalElements").value(4));
    }

    @Test
    void crudLifecycle() throws Exception {
        String body = mvc.perform(post("/api/sites").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"siteName":"Test Site","siteType":"Warehouse","workcenter":"WC-T","address":"Nowhere"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();

        mvc.perform(put("/api/sites/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"siteName\":\"Test Site 2\",\"siteType\":\"Warehouse\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.siteName").value("Test Site 2"))
                .andExpect(jsonPath("$.workcenter").value(org.hamcrest.Matchers.nullValue()));

        mvc.perform(delete("/api/sites/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/sites/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void siteNameRequired() throws Exception {
        mvc.perform(post("/api/sites").contentType(MediaType.APPLICATION_JSON).content("{\"siteName\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.siteName").exists());
    }
}
