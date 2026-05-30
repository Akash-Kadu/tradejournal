package com.tradejournal.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class TradeResponse {
    private Long srNo;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private String day;
    private Long accountSrNo;
    private Long accountId;
    private Long strategySrNo;
    private String strategy;
    private String session;
    private Integer qty;
    private Double rr;
    private Double riskPercent;
    private String buySell;
    private Double resultDollar;
    private Double resultPercent;
}
