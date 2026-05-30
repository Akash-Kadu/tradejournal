package com.tradejournal.repository;

import com.tradejournal.entity.Strategy;
import com.tradejournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StrategyRepository extends JpaRepository<Strategy, Long> {
    List<Strategy> findByUser(User user);
}
