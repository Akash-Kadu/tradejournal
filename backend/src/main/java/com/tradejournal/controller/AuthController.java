package com.tradejournal.controller;

import com.tradejournal.dto.request.LoginRequest;
import com.tradejournal.dto.request.RegisterRequest;
import com.tradejournal.dto.response.UserResponse;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Registered successfully", authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(@RequestBody LoginRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request, session)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser(session)));
    }
}
