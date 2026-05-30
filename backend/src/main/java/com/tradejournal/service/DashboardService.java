package com.tradejournal.service;

import com.tradejournal.dto.response.DashboardResponse;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;

public interface DashboardService {
    DashboardResponse getDashboardData(LocalDate startDate, LocalDate endDate, HttpSession session);
}
