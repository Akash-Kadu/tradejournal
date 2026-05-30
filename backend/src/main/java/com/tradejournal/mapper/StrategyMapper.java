package com.tradejournal.mapper;

import com.tradejournal.dto.response.StrategyResponse;
import com.tradejournal.entity.Strategy;
import org.springframework.stereotype.Component;

@Component
public class StrategyMapper {

    public StrategyResponse toResponse(Strategy strategy) {
        return StrategyResponse.builder()
                .srNo(strategy.getSrNo())
                .strategyName(strategy.getStrategyName())
                .build();
    }
}
