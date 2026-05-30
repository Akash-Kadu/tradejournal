package com.tradejournal.mapper;

import com.tradejournal.dto.response.TradeResponse;
import com.tradejournal.entity.Trade;
import org.springframework.stereotype.Component;

@Component
public class TradeMapper {

    public TradeResponse toResponse(Trade trade) {
        return TradeResponse.builder()
                .srNo(trade.getSrNo())
                .date(trade.getDate())
                .day(trade.getDay().name())
                .accountSrNo(trade.getAccount().getSrNo())
                .accountId(trade.getAccount().getAccountId())
                .strategySrNo(trade.getStrategy().getSrNo())
                .strategy(trade.getStrategy().getStrategyName())
                .session(trade.getSession().name())
                .qty(trade.getQty())
                .rr(trade.getRr())
                .riskPercent(trade.getRiskPercent())
                .buySell(trade.getBuySell().name())
                .resultDollar(trade.getResultDollar())
                .resultPercent(trade.getResultPercent())
                .build();
    }
}
