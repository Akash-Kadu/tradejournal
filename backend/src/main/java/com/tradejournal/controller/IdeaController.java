package com.tradejournal.controller;

import com.tradejournal.dto.request.IdeaRequest;
import com.tradejournal.dto.response.IdeaResponse;
import com.tradejournal.exception.ApiResponse;
import com.tradejournal.service.IdeaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ideas")
@RequiredArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IdeaResponse>>> getIdeas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String title,
            HttpSession session) {

        List<IdeaResponse> ideas;
        if (title != null && !title.isBlank()) {
            ideas = ideaService.searchByTitle(title, session);
        } else if (startDate != null && endDate != null) {
            ideas = ideaService.getIdeasByDateRange(startDate, endDate, session);
        } else {
            ideas = ideaService.getAllIdeas(session);
        }
        return ResponseEntity.ok(ApiResponse.success(ideas));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IdeaResponse>> addIdea(
            @RequestBody IdeaRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Idea added", ideaService.addIdea(request, session)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IdeaResponse>> updateIdea(
            @PathVariable Long id, @RequestBody IdeaRequest request, HttpSession session) {
        return ResponseEntity.ok(ApiResponse.success("Idea updated", ideaService.updateIdea(id, request, session)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIdea(
            @PathVariable Long id, HttpSession session) {
        ideaService.deleteIdea(id, session);
        return ResponseEntity.ok(ApiResponse.success("Idea deleted", null));
    }
}
