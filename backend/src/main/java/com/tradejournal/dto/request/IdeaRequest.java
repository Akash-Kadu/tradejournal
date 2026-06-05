package com.tradejournal.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class IdeaRequest {
    private String title;
    private String description;
    // List of base64-encoded image strings (max 4)
    private List<String> images;
    // List of tag strings e.g. ["strategy", "gold", "london"]
    private List<String> tags;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate ideaDate;
}
