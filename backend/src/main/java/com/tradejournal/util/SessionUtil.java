package com.tradejournal.util;

import com.tradejournal.entity.User;
import com.tradejournal.exception.UnauthorizedException;
import com.tradejournal.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionUtil {

    private final UserRepository userRepository;
    public static final String SESSION_USER_ID = "userId";

    public User getUserFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            throw new UnauthorizedException("Not logged in. Please login first.");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Session user not found."));
    }
}
