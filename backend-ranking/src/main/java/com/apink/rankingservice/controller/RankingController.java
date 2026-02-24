package com.apink.rankingservice.controller;

import com.apink.rankingservice.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/top")
    public ResponseEntity<List<Long>> getTopRankedPopups(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(rankingService.getTopRankedPopups(limit));
    }

    @GetMapping("/popup/{popupId}")
    public ResponseEntity<Long> getPopupRank(@PathVariable long popupId) {
        return ResponseEntity.ok(rankingService.getPopupRank(popupId));
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateRankings() {
        rankingService.updateRankings();
        return ResponseEntity.ok().build();
    }
}