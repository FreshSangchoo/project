package com.apink.poppin.api.user.entity;

import com.apink.poppin.api.user.dto.UserDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

@Getter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_consent")
public class UserConsent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_consent_id", nullable = false)
    private Integer id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_tsid", nullable = false)
    @JsonIgnore
    private User user;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "marketing_consent", nullable = false)
    private Boolean marketingConsent;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "service_push_consent", nullable = false)
    private Boolean servicePushConsent;

    @UpdateTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "marketing_updated_at")
    private LocalDateTime marketingUpdatedAt;

    @UpdateTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "service_updated_at")
    private LocalDateTime serviceUpdatedAt;

    public void updateUserConsent(UserDto.Consent userConsent) {
        if(this.marketingConsent != userConsent.getMarketingConsent()) {
            this.marketingConsent = userConsent.getMarketingConsent();
        }

        if(this.servicePushConsent != userConsent.getServicePushConsent()) {
            this.servicePushConsent = userConsent.getServicePushConsent();
        }
    }

}