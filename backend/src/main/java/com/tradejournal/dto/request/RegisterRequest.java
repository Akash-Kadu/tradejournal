package com.tradejournal.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String confirmPassword;
}
