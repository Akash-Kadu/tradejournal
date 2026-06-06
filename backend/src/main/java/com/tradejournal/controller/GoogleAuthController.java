package com.tradejournal.controller;

import com.tradejournal.entity.User;
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

    // ── Google redirects here after user picks account ────────────────────────
    // GET /api/auth/google/callback?code=...&state=https://ourtradejournal.vercel.app
    @GetMapping("/callback")
    public void handleGoogleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String state,
            HttpSession session,
            HttpServletResponse response) throws IOException {

        // Determine frontend URL from state param (fallback to localhost)
        String frontendUrl = (state != null && state.startsWith("http")) ? state : "http://localhost:3000";

        if (error != null || code == null) {
            response.sendRedirect(frontendUrl + "/login?error=google_cancelled");
            return;
        }

        try {
            // ── Exchange code for access token ────────────────────────────────
            Map<String, Object> tokenResponse = exchangeCodeForTokens(code);
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                response.sendRedirect(frontendUrl + "/login?error=google_token_failed");
                return;
            }

            String accessToken = (String) tokenResponse.get("access_token");

            // ── Fetch user profile from Google ────────────────────────────────
            Map<String, Object> googleUser = fetchGoogleUserInfo(accessToken);
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

            // ── Find or create user ───────────────────────────────────────────
            User user = findOrCreateUser(googleId, email, fullName);

            // ── Set session (same as normal login) ────────────────────────────
            session.setAttribute(SessionUtil.SESSION_USER_ID, user.getId());
            session.setMaxInactiveInterval(7 * 24 * 60 * 60);

            // ── Redirect browser to frontend dashboard ────────────────────────
            response.sendRedirect(frontendUrl + "/dashboard");

        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=google_failed");
        }
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
            ResponseEntity<Map> res = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token", request, Map.class);
            return res.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    // ── Fetch Google user profile ─────────────────────────────────────────────
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
        } catch (Exception e) {
            return null;
        }
    }

    // ── Find existing user or create new one ──────────────────────────────────
    private User findOrCreateUser(String googleId, String email, String fullName) {
        // Already linked to this Google account
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) return byGoogleId.get();

        // Email exists (registered with password) — link Google to it
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            existing.setGoogleId(googleId);
            return userRepository.save(existing);
        }

        // Brand new user
        User newUser = User.builder()
                .fullName(fullName != null ? fullName : email)
                .email(email)
                .googleId(googleId)
                .password(null)
                .build();
        return userRepository.save(newUser);
    }
}
