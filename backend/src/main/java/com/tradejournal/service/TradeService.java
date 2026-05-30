package com.tradejournal.service;

import com.tradejournal.dto.request.TradeRequest;
import com.tradejournal.dto.response.TradeResponse;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.List;

public interface TradeService {
    List<TradeResponse> getAllTrades(HttpSession session);
    List<TradeResponse> getTradesInRange(LocalDate startDate, LocalDate endDate, HttpSession session);
    TradeResponse addTrade(TradeRequest request, HttpSession session);
    TradeResponse updateTrade(Long srNo, TradeRequest request, HttpSession session);
    void deleteTrade(Long srNo, HttpSession session);
}
