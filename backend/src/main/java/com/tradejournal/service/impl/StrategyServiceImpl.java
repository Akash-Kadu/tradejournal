package com.tradejournal.service.impl;

import com.tradejournal.dto.request.StrategyRequest;
import com.tradejournal.dto.response.StrategyResponse;
import com.tradejournal.dto.response.StrategyStatsResponse;
import com.tradejournal.entity.Strategy;
import com.tradejournal.entity.Trade;
import com.tradejournal.entity.User;
import com.tradejournal.entity.enums.Session;
import com.tradejournal.exception.BadRequestException;
import com.tradejournal.exception.ResourceNotFoundException;
import com.tradejournal.mapper.StrategyMapper;
import com.tradejournal.repository.StrategyRepository;
import com.tradejournal.repository.TradeRepository;
import com.tradejournal.service.StrategyService;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StrategyServiceImpl implements StrategyService {

    private final StrategyRepository strategyRepository;
    private final TradeRepository tradeRepository;
    private final StrategyMapper strategyMapper;
    private final SessionUtil sessionUtil;

    @Override
    public List<StrategyResponse> getAllStrategies(HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return strategyRepository.findByUser(user).stream()
                .map(strategyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public StrategyResponse addStrategy(StrategyRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        if (request.getStrategyName() == null || request.getStrategyName().isBlank())
            throw new BadRequestException("Strategy name is required");

        Strategy strategy = Strategy.builder()
                .user(user)
                .strategyName(request.getStrategyName())
                .build();

        return strategyMapper.toResponse(strategyRepository.save(strategy));
    }

    @Override
    public void deleteStrategy(Long srNo, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Strategy strategy = strategyRepository.findById(srNo)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with id: " + srNo));

        if (!strategy.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to delete this strategy");

        if (tradeRepository.existsByStrategy(strategy))
            throw new BadRequestException("Cannot delete strategy that has linked trades. Delete the trades first.");

        strategyRepository.delete(strategy);
    }

    @Override
    public List<StrategyStatsResponse> getStrategyStats(HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        List<Strategy> strategies = strategyRepository.findByUser(user);

        return strategies.stream()
                .map(this::buildStrategyStats)
                .collect(Collectors.toList());
    }

    private StrategyStatsResponse buildStrategyStats(Strategy strategy) {
        List<Trade> allTrades = tradeRepository.findByStrategy(strategy);

        Map<String, StrategyStatsResponse.SessionStats> sessionStats = new LinkedHashMap<>();
        for (Session session : Session.values()) {
            List<Trade> sessionTrades = tradeRepository.findByStrategyAndSession(strategy, session);
            sessionStats.put(session.name(), buildSessionStats(sessionTrades));
        }

        int total = allTrades.size();
        int wins = (int) allTrades.stream().filter(t -> t.getResultDollar() > 0).count();
        int losses = (int) allTrades.stream().filter(t -> t.getResultDollar() < 0).count();
        int bes = total - wins - losses;
        double winRate = total > 0 ? (wins * 100.0) / total : 0;
        double avgRR = allTrades.stream().mapToDouble(Trade::getRr).average().orElse(0);
        double totalEarned = allTrades.stream().mapToDouble(Trade::getResultDollar).sum();

        return StrategyStatsResponse.builder()
                .srNo(strategy.getSrNo())
                .strategyName(strategy.getStrategyName())
                .totalTrades(total)
                .wins(wins)
                .losses(losses)
                .bes(bes)
                .winRate(round(winRate))
                .avgRR(round(avgRR))
                .totalEarned(round(totalEarned))
                .sessionStats(sessionStats)
                .build();
    }

    private StrategyStatsResponse.SessionStats buildSessionStats(List<Trade> trades) {
        int total = trades.size();
        int wins = (int) trades.stream().filter(t -> t.getResultDollar() > 0).count();
        int losses = (int) trades.stream().filter(t -> t.getResultDollar() < 0).count();
        int bes = total - wins - losses;
        double winRate = total > 0 ? (wins * 100.0) / total : 0;
        double avgRR = trades.stream().mapToDouble(Trade::getRr).average().orElse(0);
        double earned = trades.stream().mapToDouble(Trade::getResultDollar).sum();

        return StrategyStatsResponse.SessionStats.builder()
                .trades(total)
                .wins(wins)
                .losses(losses)
                .bes(bes)
                .winRate(round(winRate))
                .avgRR(round(avgRR))
                .earned(round(earned))
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
