package com.tradejournal.controller;

import com.tradejournal.dto.request.TradeRequest;
import com.tradejournal.dto.response.TradeResponse;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.service.TradeService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TradeResponse>>> getTrades(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        List<TradeResponse> trades = (startDate != null && endDate != null)
                ? tradeService.getTradesInRange(startDate, endDate, session)
                : tradeService.getAllTrades(session);
        return ResponseEntity.ok(ApiResponse.success(trades));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TradeResponse>> addTrade(
            @RequestBody TradeRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Trade added", tradeService.addTrade(request, session)));
    }

    @PutMapping("/{srNo}")
    public ResponseEntity<ApiResponse<TradeResponse>> updateTrade(
            @PathVariable Long srNo,
            @RequestBody TradeRequest request,
            HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Trade updated", tradeService.updateTrade(srNo, request, session)));
    }

    @DeleteMapping("/{srNo}")
    public ResponseEntity<ApiResponse<Void>> deleteTrade(
            @PathVariable Long srNo, HttpSession session) {
        tradeService.deleteTrade(srNo, session);
        return ResponseEntity.ok(ApiResponse.success("Trade deleted", null));
    }
}
