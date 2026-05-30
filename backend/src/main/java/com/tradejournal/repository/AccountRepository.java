package com.tradejournal.repository;

import com.tradejournal.entity.Account;
import com.tradejournal.entity.User;
import com.tradejournal.entity.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUser(User user);
    List<Account> findByUserAndPropFirmContainingIgnoreCase(User user, String propFirm);
    List<Account> findByUserAndAccountStatus(User user, AccountStatus accountStatus);
    List<Account> findByUserAndPropFirmContainingIgnoreCaseAndAccountStatus(User user, String propFirm, AccountStatus status);
    Optional<Account> findByAccountId(Long accountId);
    boolean existsByAccountId(Long accountId);
    boolean existsByAccountIdAndSrNoNot(Long accountId, Long srNo);
}
