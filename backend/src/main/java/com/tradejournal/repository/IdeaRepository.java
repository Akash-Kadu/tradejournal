package com.tradejournal.repository;

import com.tradejournal.entity.Idea;
import com.tradejournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {

    // Default: all ideas for user ordered by ideaDate desc
    List<Idea> findByUserOrderByIdeaDateDescCreatedAtDesc(User user);

    // Filter by date range
    List<Idea> findByUserAndIdeaDateBetweenOrderByIdeaDateDescCreatedAtDesc(
            User user, LocalDate startDate, LocalDate endDate);

    // Search by title (case-insensitive)
    List<Idea> findByUserAndTitleContainingIgnoreCaseOrderByIdeaDateDescCreatedAtDesc(
            User user, String title);
}
