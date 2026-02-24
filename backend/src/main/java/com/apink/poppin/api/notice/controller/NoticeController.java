package com.apink.poppin.api.notice.controller;

import com.apink.poppin.api.notice.dto.NoticeDto;
import com.apink.poppin.api.notice.dto.TokenDto;
import com.apink.poppin.api.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @PostMapping("/save-token")
    public ResponseEntity<?> createToken(@RequestBody TokenDto token) {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        token.changeUserTsid(userTsid);

        noticeService.createToken(token);

        Map<String, String> response = new HashMap<>();
        response.put("message", "create token successfully");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/advertisement")
    public ResponseEntity<?> pushAdvertisement(@RequestBody NoticeDto.Advertisement dto) {
        noticeService.createAdvertisement(dto);

        return ResponseEntity.ok().build();
    }

}
