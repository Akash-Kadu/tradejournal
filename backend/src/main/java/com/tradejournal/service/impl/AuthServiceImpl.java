package com.tradejournal.service.impl;

import com.tradejournal.dto.request.LoginRequest;
import com.tradejournal.dto.request.RegisterRequest;
import com.tradejournal.dto.response.UserResponse;
import com.tradejournal.entity.User;
import com.tradejournal.exception.BadRequestException;
import com.tradejournal.exception.UnauthorizedException;
import com.tradejournal.repository.UserRepository;
import com.tradejournal.service.AuthService;
import com.tradejournal.util.PasswordUtil;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    @Override
    public UserResponse register(RegisterRequest request) {
        if (request.getFullName() == null || request.getFullName().isBlank())
            throw new BadRequestException("Full name is required");
        if (request.getEmail() == null || request.getEmail().isBlank())
            throw new BadRequestException("Email is required");
        if (request.getPassword() == null || request.getPassword().length() < 6)
            throw new BadRequestException("Password must be at least 6 characters");
        if (!request.getPassword().equals(request.getConfirmPassword()))
            throw new BadRequestException("Passwords do not match");
        if (userRepository.existsByEmail(request.getEmail()))
            throw new BadRequestException("Email is already registered");

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .password(PasswordUtil.hash(request.getPassword()))
                .build();

        user = userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse login(LoginRequest request, HttpSession session) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!PasswordUtil.matches(request.getPassword(), user.getPassword()))
            throw new UnauthorizedException("Invalid email or password");

        session.setAttribute(SessionUtil.SESSION_USER_ID, user.getId());
        session.setMaxInactiveInterval(7 * 24 * 60 * 60);
        return toResponse(user);
    }

    @Override
    public void logout(HttpSession session) {
        session.invalidate();
    }

    @Override
    public UserResponse getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute(SessionUtil.SESSION_USER_ID);
        if (userId == null) throw new UnauthorizedException("Not logged in");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }
}
