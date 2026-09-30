package com.demo.application.repository;

import java.util.List;

import com.demo.application.model.Item;
import com.demo.application.model.ItemType;
import com.demo.application.model.LifeCyclePhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {

    boolean existsByItemNumber(String itemNumber);

    boolean existsByItemNumberAndIdNot(String itemNumber, Long id);

    long countByType(ItemType type);

    long countByLifeCyclePhase(LifeCyclePhase lifeCyclePhase);

    List<Item> findTop5ByOrderByCreatedAtDescIdDesc();

    List<Item> findTop5ByOrderByUpdatedAtDescIdDesc();
}
