package com.demo.application.service;

import java.util.ArrayList;
import java.util.List;

import com.demo.application.dto.BomNodeResponse;
import com.demo.application.mapper.BomMapper;
import com.demo.application.repository.BomRow;

/**
 * Folds depth-first ordered traversal rows into a nested tree. A row at level
 * L hangs under the most recent node at level L-1, so a shared sub-assembly
 * reached through two parents correctly appears under each of them.
 */
public final class BomTreeBuilder {

    private BomTreeBuilder() {
    }

    public static BomNodeResponse build(BomNodeResponse root, List<BomRow> depthFirstRows) {
        List<BomNodeResponse> path = new ArrayList<>();
        path.add(root);
        for (BomRow row : depthFirstRows) {
            int level = row.getLevel();
            if (level < 1 || level > path.size()) {
                throw new IllegalStateException("Rows are not in depth-first order at item "
                        + row.getItemNumber() + " (level " + level + ")");
            }
            while (path.size() > level) {
                path.remove(path.size() - 1);
            }
            BomNodeResponse node = BomMapper.fromRow(row);
            path.get(level - 1).children().add(node);
            path.add(node);
        }
        return root;
    }
}
