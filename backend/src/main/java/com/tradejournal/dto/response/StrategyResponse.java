package com.tradejournal.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StrategyResponse {
    private Long srNo;
    private String strategyName;
}
