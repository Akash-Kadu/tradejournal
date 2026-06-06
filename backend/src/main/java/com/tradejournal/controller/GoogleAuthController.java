package com.tradejournal.controller;

import com.tradejournal.dto.response.UserResponse;
import com.tradejournal.entity.User;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.repository.UserRepository;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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

    // Short-lived token store: token → userId (expires after use)
    private final ConcurrentHashMap<String, Long> pendingTokens = new ConcurrentHashMap<>();

    // ── Step 1: Google redirects here with auth code ──────────────────────────
    @GetMapping("/callback")
    public void handleGoogleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String state,
            HttpServletResponse response) throws IOException {

        String frontendUrl = (state != null && state.startsWith("http")) ? state : "http://localhost:3000";

        if (error != null || code == null) {
            response.sendRedirect(frontendUrl + "/login?error=google_cancelled");
            return;
        }

        try {
            Map<String, Object> tokenResponse = exchangeCodeForTokens(code);
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                response.sendRedirect(frontendUrl + "/login?error=google_token_failed");
                return;
            }

            Map<String, Object> googleUser = fetchGoogleUserInfo((String) tokenResponse.get("access_token"));
            if (googleUser == null) {
                response.sendRedirect(frontendUrl + "/login?error=google_user_failed");
                return;
            }

            String googleId  = (String) googleUser.get("id");
            String email     = (String) googleUser.get("email");
            String fullName  = (String) googleUser.get("name");
            Boolean verified = (Boolean) googleUser.get("verified_email");

            if (email == null || Boolean.FALSE.equals(verified)) {
                response.sendRedirect(frontendUrl + "/login?error=google_unverified");
                return;
            }

            User user = findOrCreateUser(googleId, email, fullName);

            // Generate a one-time token and store userId against it
            String otp = UUID.randomUUID().toString();
            pendingTokens.put(otp, user.getId());

            // Redirect frontend with the one-time token in URL
            response.sendRedirect(frontendUrl + "/login?google_token=" + otp);

        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=google_failed");
        }
    }

    // ── Step 2: Frontend calls this to exchange token for a real session ───────
    // GET /api/auth/google/verify?token=xxx
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<UserResponse>> verifyGoogleToken(
            @RequestParam String token,
            HttpSession session) {

        Long userId = pendingTokens.remove(token); // one-time use
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired Google token"));
        }

        User user = userRepository.findById(userId)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("User not found"));
        }

        session.setAttribute(SessionUtil.SESSION_USER_ID, user.getId());
        session.setMaxInactiveInterval(7 * 24 * 60 * 60);

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

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
            ResponseEntity<Map> res = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token", request, Map.class);
            return res.getBody();
        } catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGoogleUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Map> res = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET, request, Map.class);
            return res.getBody();
        } catch (Exception e) { return null; }
    }

    private User findOrCreateUser(String googleId, String email, String fullName) {
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) return byGoogleId.get();

        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            existing.setGoogleId(googleId);
            return userRepository.save(existing);
        }

        return userRepository.save(User.builder()
                .fullName(fullName != null ? fullName : email)
                .email(email)
                .googleId(googleId)
                .password(null)
                .build());
    }
}
