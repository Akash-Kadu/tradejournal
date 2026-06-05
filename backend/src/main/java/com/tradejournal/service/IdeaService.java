package com.tradejournal.service;

import com.tradejournal.dto.request.IdeaRequest;
import com.tradejournal.dto.response.IdeaResponse;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.List;

public interface IdeaService {
    List<IdeaResponse> getAllIdeas(HttpSession session);
    List<IdeaResponse> getIdeasByDateRange(LocalDate startDate, LocalDate endDate, HttpSession session);
    List<IdeaResponse> searchByTitle(String title, HttpSession session);
    IdeaResponse addIdea(IdeaRequest request, HttpSession session);
    IdeaResponse updateIdea(Long id, IdeaRequest request, HttpSession session);
    void deleteIdea(Long id, HttpSession session);
}
