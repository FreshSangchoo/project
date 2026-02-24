package com.apink.rankingservice.config;

import com.apink.rankingservice.dto.PopupRankingDto;
import com.apink.rankingservice.entity.PopupRanking;
import com.apink.rankingservice.service.RankingService;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.JdbcCursorItemReader;
import org.springframework.batch.item.database.builder.JdbcCursorItemReaderBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
public class BatchConfig {

    private static final Logger logger = LoggerFactory.getLogger(BatchConfig.class);
    private final RankingService rankingService;
    private final EntityManagerFactory entityManagerFactory;

    @Bean
    public Job updatePopupRankingJob(JobRepository jobRepository, Step updatePopupRankingStep) {
        return new JobBuilder("updatePopupRankingJob", jobRepository)
                .start(updatePopupRankingStep)
                .build();
    }

    @Bean
    public Step updatePopupRankingStep(JobRepository jobRepository,
                                       @Qualifier("mainTransactionManager") PlatformTransactionManager mainTransactionManager,
                                       JdbcCursorItemReader<PopupRankingDto> reader,
                                       ItemWriter<PopupRanking> writer) {
        return new StepBuilder("updatePopupRankingStep", jobRepository)
                .<PopupRankingDto, PopupRanking>chunk(100, jpaTransactionManager())
                .reader(reader)
                .processor(this::processPopupRanking)
                .writer(writer)
                .build();
    }

    @Bean
    public PlatformTransactionManager jpaTransactionManager() {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean
    public JdbcCursorItemReader<PopupRankingDto> reader(@Qualifier("mainServiceDataSource") DataSource dataSource) {
        String sql = "SELECT p.popup_id as popupId, p.start_date as creationDate, \n" +
                "                           p.hit as views,\n" +
                "                           COALESCE(h.heart_count, 0) as likes,\n" +
                "                           COALESCE(p.rating, 0) as reviewScore,\n" +
                "                           COALESCE(r.review_count, 0) as reviewCount,\n" +
                "                           COALESCE(pr.reservation_count, 0) as reservations\n" +
                "                    FROM popup p\n" +
                "                    LEFT JOIN (SELECT popup_id, COUNT(*) as heart_count \n" +
                "                               FROM heart \n" +
                "                               GROUP BY popup_id) h ON p.popup_id = h.popup_id\n" +
                "                    LEFT JOIN (SELECT popup_id, COUNT(*) as review_count \n" +
                "                               FROM review \n" +
                "                               WHERE is_deleted = false \n" +
                "                               GROUP BY popup_id) r ON p.popup_id = r.popup_id\n" +
                "                    LEFT JOIN (SELECT popup_id, COUNT(*) as reservation_count \n" +
                "                               FROM pre_reservation \n" +
                "                               GROUP BY popup_id) pr ON p.popup_id = pr.popup_id\n" +
                "                    WHERE p.deleted = false AND p.end_date > now() AND p.start_date <= now();";

        return new JdbcCursorItemReaderBuilder<PopupRankingDto>()
                .dataSource(dataSource)
                .name("popupRankingReader")
                .sql(sql)
                .rowMapper(new PopupRankingRowMapper())
                .build();
    }

    @Bean
    public ItemWriter<PopupRanking> writer() {
        return new ItemWriter<PopupRanking>() {
            @Override
            public void write(Chunk<? extends PopupRanking> chunk) throws Exception {
                rankingService.deleteAllAndSave(chunk);
            }
        };
    }

    private PopupRanking processPopupRanking(PopupRankingDto dto) {
        logger.debug("dto : {}", dto);
        PopupRanking result = PopupRanking.builder()
                .popupId(dto.getPopupId())
                .views(dto.getViews())
                .likes(dto.getLikes())
                .reviewScore(dto.getReviewScore())
                .reviewCount(dto.getReviewCount())
                .reservations(dto.getReservations())
                .creationDate(dto.getCreationDate())
                .build();
        logger.debug("Processed entity: {}", result);
        return result;
    }

    private static class PopupRankingRowMapper implements RowMapper<PopupRankingDto> {
        @Override
        public PopupRankingDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return PopupRankingDto.builder()
                    .popupId(rs.getLong("popupId"))
                    .creationDate(rs.getObject("creationDate", LocalDate.class))
                    .views(rs.getInt("views"))
                    .likes(rs.getInt("likes"))
                    .reviewScore(rs.getDouble("reviewScore"))
                    .reviewCount(rs.getInt("reviewCount"))
                    .reservations(rs.getInt("reservations"))
                    .build();
        }
    }
}