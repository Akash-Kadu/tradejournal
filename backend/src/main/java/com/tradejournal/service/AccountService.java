package com.tradejournal.service;

import com.tradejournal.dto.request.AccountRequest;
import com.tradejournal.dto.response.AccountResponse;
import jakarta.servlet.http.HttpSession;
import java.util.List;

public interface AccountService {
    List<AccountResponse> getAllAccounts(HttpSession session);
    AccountResponse addAccount(AccountRequest request, HttpSession session);
    AccountResponse updateAccount(Long srNo, AccountRequest request, HttpSession session);
    void deleteAccount(Long srNo, HttpSession session);
    List<AccountResponse> filterAccounts(String propFirm, String status, HttpSession session);
}
