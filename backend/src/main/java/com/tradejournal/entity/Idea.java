package com.tradejournal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ideas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString(exclude = "user")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Idea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    // Full description — stored as TEXT to support long content
    @Column(columnDefinition = "TEXT")
    private String description;

    // Up to 4 images stored as Base64 strings, comma-separated in LONGTEXT
    // Frontend splits on "|||" delimiter to get individual images
    @Column(columnDefinition = "LONGTEXT")
    private String images;

    // Tags stored as comma-separated string e.g. "strategy,gold,london"
    @Column(length = 500)
    private String tags;

    // User-chosen date for the idea
    @Column(nullable = false)
    private LocalDate ideaDate;

    // Auto-set on creation
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
