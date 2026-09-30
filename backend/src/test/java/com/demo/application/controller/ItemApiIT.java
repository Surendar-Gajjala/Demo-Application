package com.demo.application.controller;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.demo.application.AbstractPostgresIT;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class ItemApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    static String itemJson(String number, String name) {
        return """
                {"itemNumber":"%s","itemName":"%s","description":"test item",
                 "type":"ASSEMBLY","lifeCyclePhase":"DESIGN","productFamily":"Test"}
                """.formatted(number, name);
    }

    long createItem(String number) throws Exception {
        String body = mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson(number, "Name " + number)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Test
    void createReturns201WithLocationAndTimestamps() throws Exception {
        String number = unique("T");
        mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(itemJson(number, "Widget")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/items/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.itemNumber").value(number))
                .andExpect(jsonPath("$.type").value("ASSEMBLY"))
                .andExpect(jsonPath("$.lifeCyclePhase").value("DESIGN"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());
    }

    @Test
    void duplicateItemNumberReturns409() throws Exception {
        mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(itemJson("PROD-001", "Dup")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("Item number 'PROD-001' already exists"));
    }

    @Test
    void invalidBodyReturns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemNumber\":\"\",\"itemName\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.instance").value("/api/items"))
                .andExpect(jsonPath("$.errors.itemNumber").exists())
                .andExpect(jsonPath("$.errors.type").exists())
                .andExpect(jsonPath("$.errors.lifeCyclePhase").exists());
    }

    @Test
    void unknownEnumValueReturns400() throws Exception {
        mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson("X-1", "x").replace("\"DESIGN\"", "\"ACTIVE\"")))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/items").param("type", "COMPONENT"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void searchMatchesNumberOrNameCaseInsensitiveWithFiltersAndPaging() throws Exception {
        mvc.perform(get("/api/items").param("search", "prod-00").param("size", "2").param("sort", "itemNumber,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].itemNumber").value("PROD-005"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));

        mvc.perform(get("/api/items").param("search", "cpu module"))
                .andExpect(jsonPath("$.content[*].itemNumber", hasItem("ITEM-0001")));

        mvc.perform(get("/api/items").param("type", "FINISHED").param("lifeCyclePhase", "DESIGN"))
                .andExpect(jsonPath("$.content[*].type", everyItem(org.hamcrest.Matchers.is("FINISHED"))))
                .andExpect(jsonPath("$.content[*].lifeCyclePhase", everyItem(org.hamcrest.Matchers.is("DESIGN"))))
                .andExpect(jsonPath("$.content[*].itemNumber", hasItem("PROD-004")));
    }

    @Test
    void likeWildcardsInSearchAreLiteral() throws Exception {
        mvc.perform(get("/api/items").param("search", "%"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void unsupportedSortReturns400() throws Exception {
        mvc.perform(get("/api/items").param("sort", "id,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(startsWith("Unsupported sort field 'id'")));
    }

    @Test
    void getUnknownReturns404() throws Exception {
        mvc.perform(get("/api/items/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Item 999999 not found"));
    }

    @Test
    void updateReplacesFieldsAndRejectsTakenNumber() throws Exception {
        long id = createItem(unique("U"));
        String newNumber = unique("U2");

        JsonNode before = json.readTree(mvc.perform(get("/api/items/" + id)).andReturn().getResponse().getContentAsString());

        mvc.perform(put("/api/items/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson(newNumber, "Renamed").replace("\"DESIGN\"", "\"PRODUCTION\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemNumber").value(newNumber))
                .andExpect(jsonPath("$.itemName").value("Renamed"))
                .andExpect(jsonPath("$.lifeCyclePhase").value("PRODUCTION"))
                .andExpect(jsonPath("$.createdAt").value(before.get("createdAt").asText()));

        mvc.perform(put("/api/items/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson("PROD-001", "Clash")))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteReturns204ThenGetReturns404() throws Exception {
        long id = createItem(unique("D"));
        mvc.perform(delete("/api/items/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/items/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/items/" + id)).andExpect(status().isNotFound());
    }
}
