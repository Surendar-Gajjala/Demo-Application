package com.demo.application.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
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
import org.springframework.test.web.servlet.ResultActions;

class ItemPartApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate jdbc;

    long itemId(String itemNumber) {
        return jdbc.queryForObject("SELECT id FROM item WHERE item_number = ?", Long.class, itemNumber);
    }

    static String suffix() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    long newItem() throws Exception {
        String body = mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content("""
                        {"itemNumber":"IPT-%s","itemName":"Item part test","type":"ASSEMBLY","lifeCyclePhase":"DESIGN"}
                        """.formatted(suffix())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    /** A new part without an item; returns its id. */
    long newPart(String number) throws Exception {
        String body = mvc.perform(post("/api/parts").contentType(MediaType.APPLICATION_JSON)
                        .content(PartApiIT.partJson(number, "Item part test", "DESIGN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemId").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    ResultActions attach(long itemId, long partId) throws Exception {
        return mvc.perform(post("/api/items/" + itemId + "/parts").contentType(MediaType.APPLICATION_JSON)
                .content("{\"partId\":" + partId + "}"));
    }

    @Test
    void listsSeedPartsOfAnItem() throws Exception {
        mvc.perform(get("/api/items/" + itemId("PROD-001") + "/parts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].partNumber", hasItem("A-2041")))
                .andExpect(jsonPath("$.content[*].itemNumber", everyItem(is("PROD-001"))));

        mvc.perform(get("/api/items/" + itemId("PROD-001") + "/parts").param("search", "voltage"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].partNumber").value("A-2041"));
    }

    @Test
    void attachDetachAndCandidates() throws Exception {
        long item = newItem();
        String number = "IPT-" + suffix();
        long part = newPart(number);

        // Unassigned parts are candidates; parts that belong to an item are not.
        mvc.perform(get("/api/items/" + item + "/parts/candidates").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].partNumber", hasItem(number)))
                .andExpect(jsonPath("$.content[*].partNumber", not(hasItem("A-2041"))))
                .andExpect(jsonPath("$.content[*].itemId", everyItem(nullValue())));

        attach(item, part)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemId").value(item))
                .andExpect(jsonPath("$.itemName").value("Item part test"));

        mvc.perform(get("/api/items/" + item + "/parts"))
                .andExpect(jsonPath("$.content[*].partNumber", containsInAnyOrder(number)));
        mvc.perform(get("/api/parts/" + part)).andExpect(jsonPath("$.itemId").value(item));

        // Attaching again (or to another item) is a conflict naming the owner.
        attach(item, part).andExpect(status().isConflict());
        attach(itemId("PROD-002"), part)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", containsString("already belongs to")));

        mvc.perform(delete("/api/items/" + item + "/parts/" + part)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/items/" + item + "/parts/" + part)).andExpect(status().isNotFound());
        mvc.perform(get("/api/parts/" + part))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(nullValue()));
    }

    @Test
    void deletingAnItemUnlinksItsParts() throws Exception {
        long item = newItem();
        long part = newPart("IPT-" + suffix());
        attach(item, part).andExpect(status().isCreated());

        mvc.perform(delete("/api/items/" + item)).andExpect(status().isNoContent());

        mvc.perform(get("/api/parts/" + part))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(nullValue()));
    }

    @Test
    void unknownItemOrPartIs404() throws Exception {
        mvc.perform(get("/api/items/999999/parts")).andExpect(status().isNotFound());
        mvc.perform(get("/api/items/999999/parts/candidates")).andExpect(status().isNotFound());
        attach(itemId("PROD-001"), 999999).andExpect(status().isNotFound());
        mvc.perform(post("/api/items/" + itemId("PROD-001") + "/parts")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.partId").exists());
    }
}
