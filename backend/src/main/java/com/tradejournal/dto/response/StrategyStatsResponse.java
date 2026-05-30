package com.tradejournal.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class StrategyStatsResponse {
    private Long srNo;
    private String strategyName;
    private Integer totalTrades;
    private Integer wins;
    private Integer losses;
    private Integer bes;
    private Double winRate;
    private Double avgRR;
    private Double totalEarned;
    private Map<String, SessionStats> sessionStats;

    @Data
    @Builder
    public static class SessionStats {
        private Integer trades;
        private Integer wins;
        private Integer losses;
        private Integer bes;
        private Double winRate;
        private Double avgRR;
        private Double earned;
    }
}
