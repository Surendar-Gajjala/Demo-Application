package com.demo.application.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.demo.application.AbstractPostgresIT;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class PartApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    static String partJson(String number, String name, String phase) {
        return """
                {"partNumber":"%s","partName":"%s","description":"test part",
                 "manufactureName":"Acme","lifeCyclePhase":"%s"}
                """.formatted(number, name, phase);
    }

    @Test
    void searchByNumberOrNameWithLifecycleFilter() throws Exception {
        mvc.perform(get("/api/parts").param("search", "a-2041"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].partName").value("Voltage Regulator"))
                .andExpect(jsonPath("$.content[0].manufactureName").value("Linear Technology"));

        mvc.perform(get("/api/parts").param("search", "display panel").param("lifeCyclePhase", "DESIGN"))
                .andExpect(jsonPath("$.totalElements").value(2));

        mvc.perform(get("/api/parts").param("sort", "partName,asc").param("size", "1"))
                .andExpect(jsonPath("$.content[0].partName").value("Battery Protection IC"));
    }

    @Test
    void crudLifecycle() throws Exception {
        String number = "P-" + UUID.randomUUID().toString().substring(0, 8);
        String body = mvc.perform(post("/api/parts").contentType(MediaType.APPLICATION_JSON)
                        .content(partJson(number, "Gasket", "DESIGN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.partNumber").value(number))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();

        mvc.perform(post("/api/parts").contentType(MediaType.APPLICATION_JSON)
                        .content(partJson(number, "Again", "DESIGN")))
                .andExpect(status().isConflict());

        mvc.perform(put("/api/parts/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content(partJson(number, "Gasket v2", "PRODUCTION")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partName").value("Gasket v2"))
                .andExpect(jsonPath("$.lifeCyclePhase").value("PRODUCTION"));

        mvc.perform(delete("/api/parts/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/parts/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void validationErrors() throws Exception {
        mvc.perform(post("/api/parts").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.partNumber").exists())
                .andExpect(jsonPath("$.errors.partName").exists())
                .andExpect(jsonPath("$.errors.lifeCyclePhase").exists());
    }
}
