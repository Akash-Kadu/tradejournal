package com.tradejournal.mapper;

import com.tradejournal.dto.response.AccountResponse;
import com.tradejournal.entity.Account;
import org.springframework.stereotype.Component;

@Component
public class AccountMapper {

    public AccountResponse toResponse(Account account) {
        double changeDollar = account.getCurrentBalance() - account.getAccountSize();
        double changePercent = account.getAccountSize() != 0
                ? (changeDollar * 100.0) / account.getAccountSize()
                : 0.0;

        return AccountResponse.builder()
                .srNo(account.getSrNo())
                .propFirm(account.getPropFirm())
                .accountId(account.getAccountId())
                .accountStatus(account.getAccountStatus().name())
                .accountSize(account.getAccountSize())
                .currentBalance(account.getCurrentBalance())
                .changeDollar(round(changeDollar))
                .changePercent(round(changePercent))
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
