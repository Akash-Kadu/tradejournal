package com.tradejournal.dto.request;

import com.tradejournal.entity.enums.AccountStatus;
import lombok.Data;

@Data
public class AccountRequest {
    private String propFirm;
    private Long accountId;
    private AccountStatus accountStatus;
    private Double accountSize;
    private Double currentBalance;
}
