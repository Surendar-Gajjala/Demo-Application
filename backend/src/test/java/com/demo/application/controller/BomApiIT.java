package com.demo.application.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

class BomApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate jdbc;

    long id(String itemNumber) {
        return jdbc.queryForObject("SELECT id FROM item WHERE item_number = ?", Long.class, itemNumber);
    }

    long newItem() throws Exception {
        String number = "BOMT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String body = mvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content("""
                        {"itemNumber":"%s","itemName":"Bom test","type":"ASSEMBLY","lifeCyclePhase":"DESIGN"}
                        """.formatted(number)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    ResultActions link(long parentId, long childId, String quantity) throws Exception {
        return mvc.perform(post("/api/items/" + parentId + "/bom").contentType(MediaType.APPLICATION_JSON)
                .content("{\"childId\":" + childId + ",\"quantity\":" + quantity + "}"));
    }

    long linkId(long parentId, long childId) throws Exception {
        String body = link(parentId, childId, "1").andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("bomId").asLong();
    }

    @Test
    void explosionReturnsNestedTreeOrderedBySequence() throws Exception {
        mvc.perform(get("/api/items/" + id("PROD-001") + "/bom"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemNumber").value("PROD-001"))
                .andExpect(jsonPath("$.level").value(0))
                .andExpect(jsonPath("$.bomId").doesNotExist())
                .andExpect(jsonPath("$.hasChildren").value(true))
                .andExpect(jsonPath("$.children[*].itemNumber").value(
                        org.hamcrest.Matchers.contains("ASSEMBLY-001", "ASSEMBLY-SHARED", "ITEM-0005")))
                .andExpect(jsonPath("$.children[0].level").value(1))
                .andExpect(jsonPath("$.children[0].children[0].itemNumber").value("ITEM-0001"))
                .andExpect(jsonPath("$.children[0].children[0].level").value(2))
                .andExpect(jsonPath("$.children[0].children[0].children[0].itemNumber").value("COMPONENT-001"))
                .andExpect(jsonPath("$.children[0].children[0].children[0].level").value(3))
                .andExpect(jsonPath("$.children[0].children[0].children[0].hasChildren").value(false))
                .andExpect(jsonPath("$.children[0].children[1].quantity").value(2));
    }

    @Test
    void maxDepthLimitsLevelsButKeepsHasChildren() throws Exception {
        mvc.perform(get("/api/items/" + id("PROD-001") + "/bom").param("maxDepth", "1"))
                .andExpect(jsonPath("$.children.length()").value(3))
                .andExpect(jsonPath("$.children[0].hasChildren").value(true))
                .andExpect(jsonPath("$.children[0].children.length()").value(0));
    }

    @Test
    void childrenReturnsDirectChildrenOnly() throws Exception {
        mvc.perform(get("/api/items/" + id("ASSEMBLY-SHARED") + "/bom/children"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].itemNumber").value(
                        org.hamcrest.Matchers.contains("COMPONENT-002", "COMPONENT-003")))
                .andExpect(jsonPath("$[0].level").value(1))
                .andExpect(jsonPath("$[0].children.length()").value(0));
    }

    @Test
    void whereUsedAndParentsWalkUpward() throws Exception {
        mvc.perform(get("/api/items/" + id("ASSEMBLY-SHARED") + "/bom/parents"))
                .andExpect(jsonPath("$[*].itemNumber").value(containsInAnyOrder("PROD-001", "PROD-002")));

        mvc.perform(get("/api/items/" + id("COMPONENT-001") + "/bom/where-used"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemNumber").value("COMPONENT-001"))
                .andExpect(jsonPath("$.children[*].itemNumber").value(containsInAnyOrder("ITEM-0001", "ITEM-0002")))
                .andExpect(jsonPath("$.children[0].children[0].children[0].itemNumber").value("PROD-001"))
                .andExpect(jsonPath("$.children[0].children[0].children[0].hasChildren").value(false));
    }

    @Test
    void rootsAreItemsWithChildrenAndNoParent() throws Exception {
        mvc.perform(get("/api/items/bom-roots").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].itemNumber").value(hasItem("PROD-001")))
                .andExpect(jsonPath("$.content[*].itemNumber").value(hasItem("PROD-005")))
                .andExpect(jsonPath("$.content[*].itemNumber").value(not(hasItem("ASSEMBLY-001"))))
                .andExpect(jsonPath("$.content[0].hasChildren").value(true));

        mvc.perform(get("/api/items/bom-roots").param("search", "product 002"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].itemNumber").value("PROD-002"));
    }

    @Test
    void addUpdateAndRemoveLink() throws Exception {
        long parent = newItem();
        long child = newItem();

        String body = link(parent, child, "2.5").andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemId").value(child))
                .andExpect(jsonPath("$.level").value(1))
                .andExpect(jsonPath("$.quantity").value(2.5))
                .andExpect(jsonPath("$.sequence").value(10))
                .andReturn().getResponse().getContentAsString();
        long bomId = json.readTree(body).get("bomId").asLong();

        mvc.perform(put("/api/items/" + parent + "/bom/" + bomId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":4,\"sequence\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(4))
                .andExpect(jsonPath("$.sequence").value(30));

        mvc.perform(get("/api/items/" + parent + "/bom/children"))
                .andExpect(jsonPath("$[0].itemId").value(child));

        mvc.perform(delete("/api/items/" + parent + "/bom/" + bomId)).andExpect(status().isNoContent());
        mvc.perform(get("/api/items/" + parent + "/bom/children")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/items/" + child)).andExpect(status().isOk());
    }

    @Test
    void rejectsInvalidLinks() throws Exception {
        long a = newItem();
        long b = newItem();
        long c = newItem();
        linkId(a, b);
        linkId(b, c);

        link(a, a, "1").andExpect(status().isBadRequest());
        link(a, b, "1").andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", containsString("already in the BOM")));
        link(c, a, "1").andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("BOM cycle"));
        link(a, 999999, "1").andExpect(status().isNotFound());
        link(a, c, "0").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity").exists());
    }

    @Test
    void editingLinkOfAnotherParentReturns404() throws Exception {
        long a = newItem();
        long b = newItem();
        long other = newItem();
        long bomId = linkId(a, b);

        mvc.perform(delete("/api/items/" + other + "/bom/" + bomId)).andExpect(status().isNotFound());
        mvc.perform(put("/api/items/" + other + "/bom/" + bomId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1,\"sequence\":10}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void dbTriggerRejectsCycleEvenWithoutServicePreCheck() throws Exception {
        long a = newItem();
        long b = newItem();
        linkId(a, b);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        jdbc.update("INSERT INTO item_bom (from_node_id, to_node_id) VALUES (?, ?)", b, a))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
                .hasMessageContaining("BOM cycle");
    }

    @Test
    void candidatesExcludeSelfChildrenAndAncestors() throws Exception {
        // grand -> parent -> child ; other is unrelated
        long grand = newItem();
        long parent = newItem();
        long child = newItem();
        long other = newItem();
        linkId(grand, parent);
        linkId(parent, child);

        String body = mvc.perform(get("/api/items/" + parent + "/bom/candidates").param("search", "BOMT-").param("size", "100"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var ids = new java.util.ArrayList<Long>();
        json.readTree(body).get("content").forEach(n -> ids.add(n.get("id").asLong()));

        org.assertj.core.api.Assertions.assertThat(ids)
                .contains(other)
                .doesNotContain(parent, child, grand);
    }

    @Test
    void candidatesSearchAndSeedAncestors() throws Exception {
        long prod1 = id("PROD-001");
        mvc.perform(get("/api/items/" + prod1 + "/bom/candidates").param("search", "assembly").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].itemNumber").value(hasItem("ASSEMBLY-002")))
                .andExpect(jsonPath("$.content[*].itemNumber").value(not(hasItem("ASSEMBLY-001"))))
                .andExpect(jsonPath("$.content[*].itemNumber").value(not(hasItem("ASSEMBLY-SHARED"))));

        // PROD-001 is an ancestor of COMPONENT-001, so it must not be offered there.
        mvc.perform(get("/api/items/" + id("COMPONENT-001") + "/bom/candidates").param("search", "prod-001"))
                .andExpect(jsonPath("$.totalElements").value(0));

        mvc.perform(get("/api/items/999999/bom/candidates")).andExpect(status().isNotFound());
    }

    @Test
    void unknownItemReturns404() throws Exception {
        mvc.perform(get("/api/items/999999/bom")).andExpect(status().isNotFound());
        mvc.perform(get("/api/items/999999/bom/where-used")).andExpect(status().isNotFound());
    }
}
