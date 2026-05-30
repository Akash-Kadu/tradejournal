package com.tradejournal.controller;

import com.tradejournal.dto.request.StrategyRequest;
import com.tradejournal.dto.response.StrategyResponse;
import com.tradejournal.dto.response.StrategyStatsResponse;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.service.StrategyService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/strategies")
@RequiredArgsConstructor
public class StrategyController {

    private final StrategyService strategyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StrategyResponse>>> getAllStrategies(HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success(strategyService.getAllStrategies(session)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<List<StrategyStatsResponse>>> getStrategyStats(HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success(strategyService.getStrategyStats(session)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StrategyResponse>> addStrategy(
            @RequestBody StrategyRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Strategy added", strategyService.addStrategy(request, session)));
    }

    @DeleteMapping("/{srNo}")
    public ResponseEntity<ApiResponse<Void>> deleteStrategy(
            @PathVariable Long srNo, HttpSession session) {
        strategyService.deleteStrategy(srNo, session);
        return ResponseEntity.ok(ApiResponse.success("Strategy deleted", null));
    }
}
