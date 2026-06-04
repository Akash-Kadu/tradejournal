package com.tradejournal.entity;

import com.tradejournal.entity.enums.BuySell;
import com.tradejournal.entity.enums.Session;
import com.tradejournal.entity.enums.TradingDay;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "trades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "account", "strategy"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long srNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradingDay day;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_sr_no", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "strategy_sr_no", nullable = false)
    private Strategy strategy;

    // Trading pair e.g. XAUUSD, NAS100, EURUSD
    @Column
    private String pair;

    @Column(nullable = false)
    private Integer qty;

    @Column(nullable = false)
    private Double rr;

    @Column(nullable = false)
    private Double riskPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BuySell buySell;

    // Always stored in USD
    @Column(nullable = false)
    private Double resultDollar;

    @Column(nullable = false)
    private Double resultPercent;
}
