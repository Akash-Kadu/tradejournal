package com.tradejournal.mapper;

import com.tradejournal.dto.response.IdeaResponse;
import com.tradejournal.entity.Idea;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class IdeaMapper {

    private static final String IMG_DELIMITER = "|||";
    private static final String TAG_DELIMITER = ",";

    public IdeaResponse toResponse(Idea idea) {
        return IdeaResponse.builder()
                .id(idea.getId())
                .title(idea.getTitle())
                .description(idea.getDescription())
                .images(parseImages(idea.getImages()))
                .tags(parseTags(idea.getTags()))
                .ideaDate(idea.getIdeaDate())
                .createdAt(idea.getCreatedAt())
                .build();
    }

    // Join list of base64 strings with delimiter for storage
    public String joinImages(List<String> images) {
        if (images == null || images.isEmpty()) return null;
        return String.join(IMG_DELIMITER, images);
    }

    // Join list of tags with comma for storage
    public String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        return String.join(TAG_DELIMITER, tags);
    }

    private List<String> parseImages(String stored) {
        if (stored == null || stored.isBlank()) return Collections.emptyList();
        return Arrays.asList(stored.split("\\|\\|\\|"));
    }

    private List<String> parseTags(String stored) {
        if (stored == null || stored.isBlank()) return Collections.emptyList();
        return Arrays.asList(stored.split(","));
    }
}
