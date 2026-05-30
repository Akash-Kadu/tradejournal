package com.tradejournal.controller;

import com.tradejournal.dto.request.AccountRequest;
import com.tradejournal.dto.response.AccountResponse;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.service.AccountService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts(
            @RequestParam(required = false) String propFirm,
            @RequestParam(required = false) String status,
            HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success(accountService.filterAccounts(propFirm, status, session)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> addAccount(
            @RequestBody AccountRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Account added successfully", accountService.addAccount(request, session)));
    }

    @PutMapping("/{srNo}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @PathVariable Long srNo,
            @RequestBody AccountRequest request,
            HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Account updated successfully", accountService.updateAccount(srNo, request, session)));
    }

    @DeleteMapping("/{srNo}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @PathVariable Long srNo, HttpSession session) {
        accountService.deleteAccount(srNo, session);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", null));
    }
}
