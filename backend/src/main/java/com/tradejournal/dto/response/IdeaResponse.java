package com.tradejournal.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class IdeaResponse {
    private Long id;
    private String title;
    private String description;
    private List<String> images;   // split from stored string
    private List<String> tags;     // split from stored string
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate ideaDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
