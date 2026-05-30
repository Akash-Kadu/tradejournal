package com.tradejournal.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private Double netPnl;
    private Integer totalTrades;
    private Integer wins;
    private Integer losses;
    private Integer bes;
    private Double winRate;
    private Double avgRR;
    private Double daysWinPercent;
    private Integer daysWin;
    private Integer totalTradingDays;
    private Double totalWin;
    private Double totalLoss;
    private Double avgWin;
    private Double avgLoss;
    private Double biggestWin;
    private Double biggestLoss;
    private List<CalendarDayData> calendarData;
    private List<GrowthDataPoint> growthData;
    private Double startingBalance;
    private Double endingBalance;
    private Double changePercent;

    @Data
    @Builder
    public static class CalendarDayData {
        private String date;
        private Double netPnl;
        private Double totalR;
        private Integer tradeCount;
        private Integer wins;
        private Integer losses;
        private Integer bes;
        private Double winRate;
    }

    @Data
    @Builder
    public static class GrowthDataPoint {
        private String date;
        private Double cumulativePnl;
    }
}
