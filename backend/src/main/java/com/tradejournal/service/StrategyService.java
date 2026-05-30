package com.tradejournal.service;

import com.tradejournal.dto.request.StrategyRequest;
import com.tradejournal.dto.response.StrategyResponse;
import com.tradejournal.dto.response.StrategyStatsResponse;
import jakarta.servlet.http.HttpSession;
import java.util.List;

public interface StrategyService {
    List<StrategyResponse> getAllStrategies(HttpSession session);
    StrategyResponse addStrategy(StrategyRequest request, HttpSession session);
    void deleteStrategy(Long srNo, HttpSession session);
    List<StrategyStatsResponse> getStrategyStats(HttpSession session);
}
