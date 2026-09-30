package com.demo.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.demo.application.dto.BomNodeResponse;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.repository.BomRow;
import org.junit.jupiter.api.Test;

class BomTreeBuilderTest {

    record Row(Long getBomId, Long getParentId, Integer getLevel, Long getItemId, String getItemNumber,
               String getItemName, String getDescription, String getType, String getLifeCyclePhase,
               BigDecimal getQuantity, Integer getSequence, Boolean getHasChildren) implements BomRow {
    }

    static Row row(long bomId, long parentId, int level, long itemId, String number, boolean hasChildren) {
        return new Row(bomId, parentId, level, itemId, number, number + " name", null,
                "ASSEMBLY", "DESIGN", BigDecimal.ONE, 10, hasChildren);
    }

    static BomNodeResponse root() {
        return new BomNodeResponse(null, 1L, "ROOT", "Root", null, ItemType.FINISHED,
                LifeCyclePhase.PRODUCTION, null, null, 0, true, new ArrayList<>());
    }

    @Test
    void foldsDepthFirstRowsIntoNestedTree() {
        // ROOT
        //   A
        //     A1
        //       A1x
        //     A2
        //   B
        //     A1   (shared: appears again under B)
        List<BomRow> rows = List.of(
                row(1, 1, 1, 2, "A", true),
                row(2, 2, 2, 3, "A1", true),
                row(3, 3, 3, 4, "A1x", false),
                row(4, 2, 2, 5, "A2", false),
                row(5, 1, 1, 6, "B", true),
                row(6, 6, 2, 3, "A1", true));

        BomNodeResponse tree = BomTreeBuilder.build(root(), rows);

        assertThat(tree.children()).extracting(BomNodeResponse::itemNumber).containsExactly("A", "B");
        BomNodeResponse a = tree.children().get(0);
        assertThat(a.children()).extracting(BomNodeResponse::itemNumber).containsExactly("A1", "A2");
        assertThat(a.children().get(0).children()).extracting(BomNodeResponse::itemNumber).containsExactly("A1x");
        assertThat(a.children().get(0).children().get(0).level()).isEqualTo(3);
        BomNodeResponse b = tree.children().get(1);
        assertThat(b.children()).extracting(BomNodeResponse::itemNumber).containsExactly("A1");
        assertThat(b.children().get(0).bomId()).isEqualTo(6L);
        assertThat(b.children().get(0).type()).isEqualTo(ItemType.ASSEMBLY);
    }

    @Test
    void emptyRowsGiveLeafRoot() {
        assertThat(BomTreeBuilder.build(root(), List.of()).children()).isEmpty();
    }

    @Test
    void rejectsRowsThatSkipALevel() {
        List<BomRow> rows = List.of(row(1, 1, 2, 2, "X", false));
        assertThatThrownBy(() -> BomTreeBuilder.build(root(), rows))
                .isInstanceOf(IllegalStateException.class);
    }
}
