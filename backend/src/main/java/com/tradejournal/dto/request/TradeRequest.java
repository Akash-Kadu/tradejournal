package com.tradejournal.dto.request;

import com.tradejournal.entity.enums.BuySell;
import com.tradejournal.entity.enums.Session;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TradeRequest {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Long accountSrNo;
    private Session session;
    private Long strategySrNo;
    private String pair;       // e.g. XAUUSD, NAS100
    private Integer qty;
    private Double rr;
    private Double riskPercent;
    private BuySell buySell;
    private Double resultDollar;  // always USD
}
