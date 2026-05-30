package com.tradejournal.repository;

import com.tradejournal.entity.Account;
import com.tradejournal.entity.Strategy;
import com.tradejournal.entity.Trade;
import com.tradejournal.entity.User;
import com.tradejournal.entity.enums.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {

    List<Trade> findByUserOrderByDateDescSrNoDesc(User user);

    List<Trade> findByUserAndDateBetweenOrderByDateDescSrNoDesc(User user, LocalDate startDate, LocalDate endDate);

    List<Trade> findByStrategy(Strategy strategy);

    List<Trade> findByStrategyAndSession(Strategy strategy, Session session);

    boolean existsByAccount(Account account);

    boolean existsByStrategy(Strategy strategy);

    @Query("SELECT t FROM Trade t WHERE t.user = :user AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC, t.srNo DESC")
    List<Trade> findTradesInRange(@Param("user") User user,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}
