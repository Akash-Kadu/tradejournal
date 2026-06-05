package com.tradejournal.service.impl;

import com.tradejournal.dto.request.AccountRequest;
import com.tradejournal.dto.response.AccountResponse;
import com.tradejournal.entity.Account;
import com.tradejournal.entity.User;
import com.tradejournal.entity.enums.AccountStatus;
import com.tradejournal.exception.BadRequestException;
import com.tradejournal.exception.ResourceNotFoundException;
import com.tradejournal.mapper.AccountMapper;
import com.tradejournal.repository.AccountRepository;
import com.tradejournal.repository.TradeRepository;
import com.tradejournal.service.AccountService;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final TradeRepository tradeRepository;
    private final AccountMapper accountMapper;
    private final SessionUtil sessionUtil;

    @Override
    public List<AccountResponse> getAllAccounts(HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return accountRepository.findByUser(user).stream()
                .map(accountMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AccountResponse addAccount(AccountRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);

        if (accountRepository.existsByAccountId(request.getAccountId()))
            throw new BadRequestException("Account ID " + request.getAccountId() + " already exists");

        Account account = Account.builder()
                .user(user)
                .propFirm(request.getPropFirm())
                .accountId(request.getAccountId())
                .accountStatus(request.getAccountStatus())
                .accountSize(request.getAccountSize())
                .currentBalance(request.getCurrentBalance())
                .build();

        return accountMapper.toResponse(accountRepository.save(account));
    }

    @Override
    public AccountResponse updateAccount(Long srNo, AccountRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Account account = accountRepository.findById(srNo)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + srNo));

        if (!account.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to update this account");

        if (accountRepository.existsByAccountIdAndSrNoNot(request.getAccountId(), srNo))
            throw new BadRequestException("Account ID " + request.getAccountId() + " already exists");

        account.setPropFirm(request.getPropFirm());
        account.setAccountId(request.getAccountId());
        account.setAccountStatus(request.getAccountStatus());
        account.setAccountSize(request.getAccountSize());
        account.setCurrentBalance(request.getCurrentBalance());

        return accountMapper.toResponse(accountRepository.save(account));
    }

    @Override
    public void deleteAccount(Long srNo, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Account account = accountRepository.findById(srNo)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + srNo));

        if (!account.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to delete this account");

        if (tradeRepository.existsByAccount(account))
            throw new BadRequestException("Cannot delete account that has linked trades. Delete the trades first.");

        accountRepository.delete(account);
    }

    @Override
    public List<AccountResponse> filterAccounts(String propFirm, String status, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        boolean hasPropFirm = propFirm != null && !propFirm.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        List<Account> accounts;
        if (hasPropFirm && hasStatus) {
            AccountStatus accountStatus = AccountStatus.valueOf(status.toUpperCase());
            accounts = accountRepository.findByUserAndPropFirmContainingIgnoreCaseAndAccountStatus(user, propFirm, accountStatus);
        } else if (hasPropFirm) {
            accounts = accountRepository.findByUserAndPropFirmContainingIgnoreCase(user, propFirm);
        } else if (hasStatus) {
            AccountStatus accountStatus = AccountStatus.valueOf(status.toUpperCase());
            accounts = accountRepository.findByUserAndAccountStatus(user, accountStatus);
        } else {
            accounts = accountRepository.findByUser(user);
        }

        return accounts.stream().map(accountMapper::toResponse).collect(Collectors.toList());
    }
}
