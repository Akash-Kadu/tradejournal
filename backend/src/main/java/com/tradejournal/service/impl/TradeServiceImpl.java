package com.tradejournal.service.impl;

import com.tradejournal.dto.request.TradeRequest;
import com.tradejournal.dto.response.TradeResponse;
import com.tradejournal.entity.Account;
import com.tradejournal.entity.Strategy;
import com.tradejournal.entity.Trade;
import com.tradejournal.entity.User;
import com.tradejournal.entity.enums.TradingDay;
import com.tradejournal.exception.BadRequestException;
import com.tradejournal.exception.ResourceNotFoundException;
import com.tradejournal.mapper.TradeMapper;
import com.tradejournal.repository.AccountRepository;
import com.tradejournal.repository.StrategyRepository;
import com.tradejournal.repository.TradeRepository;
import com.tradejournal.service.TradeService;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TradeServiceImpl implements TradeService {

    private final TradeRepository tradeRepository;
    private final AccountRepository accountRepository;
    private final StrategyRepository strategyRepository;
    private final TradeMapper tradeMapper;
    private final SessionUtil sessionUtil;

    @Override
    public List<TradeResponse> getAllTrades(HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return tradeRepository.findByUserOrderByDateDescSrNoDesc(user).stream()
                .map(tradeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TradeResponse> getTradesInRange(LocalDate startDate, LocalDate endDate, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return tradeRepository.findByUserAndDateBetweenOrderByDateDescSrNoDesc(user, startDate, endDate).stream()
                .map(tradeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TradeResponse addTrade(TradeRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);

        Account account = accountRepository.findById(request.getAccountSrNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountSrNo()));
        if (!account.getUser().getId().equals(user.getId()))
            throw new BadRequestException("Account does not belong to you");

        Strategy strategy = strategyRepository.findById(request.getStrategySrNo())
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with id: " + request.getStrategySrNo()));
        if (!strategy.getUser().getId().equals(user.getId()))
            throw new BadRequestException("Strategy does not belong to you");

        TradingDay tradingDay = mapTradingDay(request.getDate().getDayOfWeek());
        double resultPercent = round((request.getResultDollar() / account.getAccountSize()) * 100.0);

        Trade trade = Trade.builder()
                .user(user)
                .date(request.getDate())
                .day(tradingDay)
                .account(account)
                .session(request.getSession())
                .strategy(strategy)
                .pair(request.getPair())          // ← ADDED: saves pair to DB
                .qty(request.getQty())
                .rr(request.getRr())
                .riskPercent(request.getRiskPercent())
                .buySell(request.getBuySell())
                .resultDollar(request.getResultDollar())
                .resultPercent(resultPercent)
                .build();

        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    @Override
    public TradeResponse updateTrade(Long srNo, TradeRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Trade trade = tradeRepository.findById(srNo)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found with id: " + srNo));
        if (!trade.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to update this trade");

        Account account = accountRepository.findById(request.getAccountSrNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Strategy strategy = strategyRepository.findById(request.getStrategySrNo())
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found"));

        TradingDay tradingDay = mapTradingDay(request.getDate().getDayOfWeek());
        double resultPercent = round((request.getResultDollar() / account.getAccountSize()) * 100.0);

        trade.setDate(request.getDate());
        trade.setDay(tradingDay);
        trade.setAccount(account);
        trade.setSession(request.getSession());
        trade.setStrategy(strategy);
        trade.setPair(request.getPair());          // ← ADDED: updates pair in DB
        trade.setQty(request.getQty());
        trade.setRr(request.getRr());
        trade.setRiskPercent(request.getRiskPercent());
        trade.setBuySell(request.getBuySell());
        trade.setResultDollar(request.getResultDollar());
        trade.setResultPercent(resultPercent);

        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    @Override
    public void deleteTrade(Long srNo, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Trade trade = tradeRepository.findById(srNo)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found with id: " + srNo));
        if (!trade.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to delete this trade");
        tradeRepository.delete(trade);
    }

    private TradingDay mapTradingDay(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY    -> TradingDay.MONDAY;
            case TUESDAY   -> TradingDay.TUESDAY;
            case WEDNESDAY -> TradingDay.WEDNESDAY;
            case THURSDAY  -> TradingDay.THURSDAY;
            case FRIDAY    -> TradingDay.FRIDAY;
            case SATURDAY  -> TradingDay.SATURDAY;
            case SUNDAY    -> TradingDay.SUNDAY;
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
