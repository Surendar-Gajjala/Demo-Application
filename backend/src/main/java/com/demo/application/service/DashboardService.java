package com.demo.application.service;

import java.util.EnumMap;
import java.util.Map;

import com.demo.application.dto.DashboardSummary;
import com.demo.application.mapper.ItemMapper;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import com.demo.application.repository.ItemBomRepository;
import com.demo.application.repository.ItemRepository;
import com.demo.application.repository.PartRepository;
import com.demo.application.repository.SiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ItemRepository itemRepository;
    private final PartRepository partRepository;
    private final SiteRepository siteRepository;
    private final ItemBomRepository bomRepository;

    public DashboardService(ItemRepository itemRepository, PartRepository partRepository,
                            SiteRepository siteRepository, ItemBomRepository bomRepository) {
        this.itemRepository = itemRepository;
        this.partRepository = partRepository;
        this.siteRepository = siteRepository;
        this.bomRepository = bomRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary() {
        Map<LifeCyclePhase, Long> byPhase = new EnumMap<>(LifeCyclePhase.class);
        for (LifeCyclePhase phase : LifeCyclePhase.values()) {
            byPhase.put(phase, itemRepository.countByLifeCyclePhase(phase));
        }
        Map<ItemType, Long> byType = new EnumMap<>(ItemType.class);
        for (ItemType type : ItemType.values()) {
            byType.put(type, itemRepository.countByType(type));
        }
        return new DashboardSummary(
                itemRepository.count(),
                partRepository.count(),
                siteRepository.count(),
                byPhase,
                byType,
                bomRepository.count(),
                itemRepository.findTop5ByOrderByCreatedAtDescIdDesc().stream().map(ItemMapper::toResponse).toList(),
                itemRepository.findTop5ByOrderByUpdatedAtDescIdDesc().stream().map(ItemMapper::toResponse).toList());
    }
}
