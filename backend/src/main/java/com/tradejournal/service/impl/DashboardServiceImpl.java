package com.tradejournal.service.impl;

import com.tradejournal.dto.response.DashboardResponse;
import com.tradejournal.entity.Trade;
import com.tradejournal.entity.User;
import com.tradejournal.repository.TradeRepository;
import com.tradejournal.service.DashboardService;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardServiceImpl implements DashboardService {

    private final TradeRepository tradeRepository;
    private final SessionUtil sessionUtil;

    @Override
    public DashboardResponse getDashboardData(LocalDate startDate, LocalDate endDate, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        List<Trade> trades = tradeRepository.findTradesInRange(user, startDate, endDate);

        // ── Core stats ──────────────────────────────────────────────────────
        int totalTrades = trades.size();
        int wins    = (int) trades.stream().filter(t -> t.getResultDollar() > 0).count();
        int losses  = (int) trades.stream().filter(t -> t.getResultDollar() < 0).count();
        int bes     = totalTrades - wins - losses;
        double netPnl   = trades.stream().mapToDouble(Trade::getResultDollar).sum();
        double winRate  = totalTrades > 0 ? (wins * 100.0) / totalTrades : 0;
        double avgRR    = trades.stream().mapToDouble(Trade::getRr).average().orElse(0);

        // ── Win/Loss amounts ─────────────────────────────────────────────────
        double totalWin  = trades.stream().filter(t -> t.getResultDollar() > 0).mapToDouble(Trade::getResultDollar).sum();
        double totalLoss = trades.stream().filter(t -> t.getResultDollar() < 0).mapToDouble(Trade::getResultDollar).sum();
        double avgWin    = wins   > 0 ? totalWin  / wins   : 0;
        double avgLoss   = losses > 0 ? totalLoss / losses : 0;
        double biggestWin  = trades.stream().mapToDouble(Trade::getResultDollar).filter(d -> d > 0).max().orElse(0);
        double biggestLoss = trades.stream().mapToDouble(Trade::getResultDollar).filter(d -> d < 0).min().orElse(0);

        // ── Days win % ───────────────────────────────────────────────────────
        Map<LocalDate, List<Trade>> tradesByDate = trades.stream()
                .collect(Collectors.groupingBy(Trade::getDate));
        int totalTradingDays = tradesByDate.size();
        int daysWin = (int) tradesByDate.values().stream()
                .filter(dayTrades -> dayTrades.stream().mapToDouble(Trade::getResultDollar).sum() > 0)
                .count();
        double daysWinPercent = totalTradingDays > 0 ? (daysWin * 100.0) / totalTradingDays : 0;

        // ── Calendar data ────────────────────────────────────────────────────
        List<DashboardResponse.CalendarDayData> calendarData = tradesByDate.entrySet().stream()
                .map(e -> buildCalendarDay(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(DashboardResponse.CalendarDayData::getDate))
                .collect(Collectors.toList());

        // ── Growth data (cumulative P&L, only on trading days) ───────────────
        List<DashboardResponse.GrowthDataPoint> growthData = buildGrowthData(trades, startDate, endDate);

        return DashboardResponse.builder()
                .netPnl(round(netPnl))
                .totalTrades(totalTrades)
                .wins(wins)
                .losses(losses)
                .bes(bes)
                .winRate(round(winRate))
                .avgRR(round(avgRR))
                .daysWinPercent(round(daysWinPercent))
                .daysWin(daysWin)
                .totalTradingDays(totalTradingDays)
                .totalWin(round(totalWin))
                .totalLoss(round(totalLoss))
                .avgWin(round(avgWin))
                .avgLoss(round(avgLoss))
                .biggestWin(round(biggestWin))
                .biggestLoss(round(biggestLoss))
                .calendarData(calendarData)
                .growthData(growthData)
                .startingBalance(0.0)
                .endingBalance(round(netPnl))
                .changePercent(0.0)
                .build();
    }

    private DashboardResponse.CalendarDayData buildCalendarDay(LocalDate date, List<Trade> trades) {
        double netPnl  = trades.stream().mapToDouble(Trade::getResultDollar).sum();
        double totalR  = trades.stream().mapToDouble(Trade::getRr).sum();
        int wins   = (int) trades.stream().filter(t -> t.getResultDollar() > 0).count();
        int losses = (int) trades.stream().filter(t -> t.getResultDollar() < 0).count();
        int bes    = trades.size() - wins - losses;
        double winRate = trades.size() > 0 ? (wins * 100.0) / trades.size() : 0;

        return DashboardResponse.CalendarDayData.builder()
                .date(date.toString())
                .netPnl(round(netPnl))
                .totalR(round(totalR))
                .tradeCount(trades.size())
                .wins(wins)
                .losses(losses)
                .bes(bes)
                .winRate(round(winRate))
                .build();
    }

    private List<DashboardResponse.GrowthDataPoint> buildGrowthData(
            List<Trade> trades, LocalDate startDate, LocalDate endDate) {

        // Group daily P&L
        Map<LocalDate, Double> dailyPnl = trades.stream()
                .collect(Collectors.groupingBy(Trade::getDate,
                        Collectors.summingDouble(Trade::getResultDollar)));

        List<DashboardResponse.GrowthDataPoint> growth = new ArrayList<>();
        double cumulative = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (dailyPnl.containsKey(current)) {
                cumulative += dailyPnl.get(current);
                growth.add(DashboardResponse.GrowthDataPoint.builder()
                        .date(current.toString())
                        .cumulativePnl(round(cumulative))
                        .build());
            }
            current = current.plusDays(1);
        }
        return growth;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
