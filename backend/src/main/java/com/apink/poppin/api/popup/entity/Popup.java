package com.apink.poppin.api.popup.entity;

import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.popup.dto.PopupRequestDTO;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Popup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="popup_id")
    private Long popupId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "manager_tsid", nullable = false)
    private Manager manager;

    @NotNull
    private String name;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    @NotNull
    private String hours;
    @NotNull
    private String description;

    private String snsUrl;
    private String pageUrl;

    @NotNull
    private String content;

    @NotNull
    private String address;

//     위도 경도
    @NotNull
    private Double lat;
    @NotNull
    private Double lon;

    @ColumnDefault("0")
    private int heart;
    @ColumnDefault("0")
    private int hit;
    @ColumnDefault("0.0")
    private Double rating;

    @ColumnDefault("false")
    private boolean deleted;

    @CreationTimestamp
    private LocalDate createdAt;


    public void updatePopup(PopupRequestDTO reqDto) {
        this.name = reqDto.getName();
        this.startDate = reqDto.getStartDate();
        this.endDate = reqDto.getEndDate();
        this.hours = reqDto.getHours();
        this.description = reqDto.getDescription();
        this.snsUrl = reqDto.getSnsUrl();
        this.pageUrl = reqDto.getPageUrl();
        this.content = reqDto.getContent();
        this.address = reqDto.getAddress();
        this.lat = reqDto.getLat();
        this.lon = reqDto.getLon();
    }

    public void updateHit() {
        this.hit++;
    }

    public void deletePopup() {
        this.deleted = true;
    }
}
