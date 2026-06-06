package com.tradejournal.controller;

import com.tradejournal.dto.response.UserResponse;
import com.tradejournal.entity.User;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.repository.UserRepository;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/google")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    // ── Step 1: Frontend sends the auth code it got from Google ──────────────
    // POST /api/auth/google/callback  { "code": "4/0Ab..." }
    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<UserResponse>> handleGoogleCallback(
            @RequestBody Map<String, String> body,
            HttpSession session) {

        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Missing authorization code"));
        }

        // ── Exchange code for tokens ──────────────────────────────────────────
        Map<String, Object> tokenResponse = exchangeCodeForTokens(code);
        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Failed to exchange Google auth code"));
        }

        String accessToken = (String) tokenResponse.get("access_token");

        // ── Fetch user info from Google ───────────────────────────────────────
        Map<String, Object> googleUser = fetchGoogleUserInfo(accessToken);
        if (googleUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Failed to fetch Google user info"));
        }

        String googleId  = (String) googleUser.get("id");
        String email     = (String) googleUser.get("email");
        String fullName  = (String) googleUser.get("name");
        Boolean verified = (Boolean) googleUser.get("verified_email");

        if (email == null || Boolean.FALSE.equals(verified)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Google account email not verified"));
        }

        // ── Find or create user ───────────────────────────────────────────────
        User user = findOrCreateUser(googleId, email, fullName);

        // ── Set session (same as normal login) ────────────────────────────────
        session.setAttribute(SessionUtil.SESSION_USER_ID, user.getId());
        session.setMaxInactiveInterval(7 * 24 * 60 * 60);

        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Exchange authorization code → access token ────────────────────────────
    @SuppressWarnings("unchecked")
    private Map<String, Object> exchangeCodeForTokens(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code",          code);
            params.add("client_id",     clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri",  redirectUri);
            params.add("grant_type",    "authorization_code");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token", request, Map.class);

            return response.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    // ── Fetch Google user profile using access token ──────────────────────────
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGoogleUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET, request, Map.class);

            return response.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    // ── Find existing user or create a new one ────────────────────────────────
    private User findOrCreateUser(String googleId, String email, String fullName) {

        // 1. Already linked to this Google account
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) return byGoogleId.get();

        // 2. Email exists (registered with password before) — link Google account
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            existing.setGoogleId(googleId);
            return userRepository.save(existing);
        }

        // 3. Brand new user — create account
        User newUser = User.builder()
                .fullName(fullName != null ? fullName : email)
                .email(email)
                .googleId(googleId)
                .password(null) // Google users have no password
                .build();

        return userRepository.save(newUser);
    }
}
