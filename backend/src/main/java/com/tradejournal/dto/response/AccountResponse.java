package com.tradejournal.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountResponse {
    private Long srNo;
    private String propFirm;
    private Long accountId;
    private String accountStatus;
    private Double accountSize;
    private Double currentBalance;
    private Double changeDollar;
    private Double changePercent;
}
