package com.apink.poppin.common.scheduler;

import com.apink.poppin.api.notice.service.NoticeService;
import com.apink.poppin.api.reservation.service.OnsiteReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduleTask {

    private final OnsiteReservationService onsiteReservationService;
    private final NoticeService noticeService;

    @Scheduled(cron = "0 0 3 * * ?")
    public void saveOnsiteReservations() {
        onsiteReservationService.saveScheduling();
    }

    @Scheduled(cron = "0 17 17 * * ?")
    public void noticeCheckReservations() {
        System.out.println("왔다.");
        noticeService.checkReservations();
    }
}
