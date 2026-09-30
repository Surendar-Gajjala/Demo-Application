package com.demo.application.repository;

import java.math.BigDecimal;

/**
 * One flat row of a recursive BOM traversal. Rows come back in depth-first
 * order so they can be folded into a tree by level.
 */
public interface BomRow {

    Long getBomId();

    /** Item this row hangs under in the traversal tree. */
    Long getParentId();

    /** 1 = direct child (or parent for where-used), 2 = next level, ... */
    Integer getLevel();

    Long getItemId();

    String getItemNumber();

    String getItemName();

    String getDescription();

    String getType();

    String getLifeCyclePhase();

    BigDecimal getQuantity();

    Integer getSequence();

    /** True if the item has further edges in the traversal direction. */
    Boolean getHasChildren();
}
