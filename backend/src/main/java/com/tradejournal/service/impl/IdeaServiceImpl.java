package com.tradejournal.service.impl;

import com.tradejournal.dto.request.IdeaRequest;
import com.tradejournal.dto.response.IdeaResponse;
import com.tradejournal.entity.Idea;
import com.tradejournal.entity.User;
import com.tradejournal.exception.BadRequestException;
import com.tradejournal.exception.ResourceNotFoundException;
import com.tradejournal.mapper.IdeaMapper;
import com.tradejournal.repository.IdeaRepository;
import com.tradejournal.service.IdeaService;
import com.tradejournal.util.SessionUtil;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class IdeaServiceImpl implements IdeaService {

    private final IdeaRepository ideaRepository;
    private final IdeaMapper ideaMapper;
    private final SessionUtil sessionUtil;

    @Override
    public List<IdeaResponse> getAllIdeas(HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return ideaRepository.findByUserOrderByIdeaDateDescCreatedAtDesc(user)
                .stream().map(ideaMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IdeaResponse> getIdeasByDateRange(LocalDate startDate, LocalDate endDate, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return ideaRepository.findByUserAndIdeaDateBetweenOrderByIdeaDateDescCreatedAtDesc(user, startDate, endDate)
                .stream().map(ideaMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IdeaResponse> searchByTitle(String title, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        return ideaRepository.findByUserAndTitleContainingIgnoreCaseOrderByIdeaDateDescCreatedAtDesc(user, title)
                .stream().map(ideaMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public IdeaResponse addIdea(IdeaRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);

        if (request.getTitle() == null || request.getTitle().isBlank())
            throw new BadRequestException("Title is required");
        if (request.getIdeaDate() == null)
            throw new BadRequestException("Date is required");
        if (request.getImages() != null && request.getImages().size() > 4)
            throw new BadRequestException("Maximum 4 images allowed");

        Idea idea = Idea.builder()
                .user(user)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .images(ideaMapper.joinImages(request.getImages()))
                .tags(ideaMapper.joinTags(request.getTags()))
                .ideaDate(request.getIdeaDate())
                .build();

        return ideaMapper.toResponse(ideaRepository.save(idea));
    }

    @Override
    public IdeaResponse updateIdea(Long id, IdeaRequest request, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));
        if (!idea.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to update this idea");
        if (request.getImages() != null && request.getImages().size() > 4)
            throw new BadRequestException("Maximum 4 images allowed");

        idea.setTitle(request.getTitle().trim());
        idea.setDescription(request.getDescription());
        idea.setImages(ideaMapper.joinImages(request.getImages()));
        idea.setTags(ideaMapper.joinTags(request.getTags()));
        idea.setIdeaDate(request.getIdeaDate());

        return ideaMapper.toResponse(ideaRepository.save(idea));
    }

    @Override
    public void deleteIdea(Long id, HttpSession session) {
        User user = sessionUtil.getUserFromSession(session);
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));
        if (!idea.getUser().getId().equals(user.getId()))
            throw new BadRequestException("You are not authorized to delete this idea");
        ideaRepository.delete(idea);
    }
}
