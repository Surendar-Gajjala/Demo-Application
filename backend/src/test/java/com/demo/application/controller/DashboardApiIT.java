package com.demo.application.controller;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.demo.application.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class DashboardApiIT extends AbstractPostgresIT {

    @Autowired
    MockMvc mvc;

    @Test
    void summaryHasCountsAndRecentItems() throws Exception {
        // Other test classes add rows to the shared DB, so assert lower bounds from the seed.
        mvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(greaterThanOrEqualTo(24)))
                .andExpect(jsonPath("$.totalParts").value(greaterThanOrEqualTo(25)))
                .andExpect(jsonPath("$.totalSites").value(greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$.totalBomLinks").value(greaterThanOrEqualTo(24)))
                .andExpect(jsonPath("$.itemsByLifeCyclePhase.DESIGN").value(greaterThanOrEqualTo(6)))
                .andExpect(jsonPath("$.itemsByLifeCyclePhase.PRODUCTION").value(greaterThanOrEqualTo(18)))
                .andExpect(jsonPath("$.itemsByType.FINISHED").value(greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$.itemsByType.ASSEMBLY").value(greaterThanOrEqualTo(19)))
                .andExpect(jsonPath("$.recentlyCreatedItems.length()").value(5))
                .andExpect(jsonPath("$.recentlyUpdatedItems.length()").value(5));
    }
}
