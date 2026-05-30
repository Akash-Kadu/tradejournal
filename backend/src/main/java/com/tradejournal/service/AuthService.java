package com.tradejournal.service;

import com.tradejournal.dto.request.LoginRequest;
import com.tradejournal.dto.request.RegisterRequest;
import com.tradejournal.dto.response.UserResponse;
import jakarta.servlet.http.HttpSession;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    UserResponse login(LoginRequest request, HttpSession session);
    void logout(HttpSession session);
    UserResponse getCurrentUser(HttpSession session);
}
