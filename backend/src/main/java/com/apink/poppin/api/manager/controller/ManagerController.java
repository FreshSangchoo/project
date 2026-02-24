package com.apink.poppin.api.manager.controller;

import com.apink.poppin.api.manager.dto.*;
import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.manager.service.ManagerService;
import com.apink.poppin.api.popup.dto.PopupDTO;
import com.apink.poppin.api.popup.service.PopupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/managers")
public class ManagerController {

    private final ManagerService managerService;
    private final PopupService  popupService;

    //TODO: Admin 권한 확인 후 매니저 전체 조회
    @GetMapping("")
    ResponseEntity<?> getManagers() {
        List<Manager> managerList = managerService.getManagerList();
        List<ManagerListDTO> result = new ArrayList<>();
        for (Manager manager : managerList) {
            result.add(ManagerListDTO.builder()
                    .managerTsid(String.valueOf(manager.getManagerTsid()))
                    .nickname(manager.getNickname())
                    .img(manager.getImg())
                    .build());
        }
        return ResponseEntity.ok(result);
    }

    //FIXME: 이미 구현된 부분으로 대체
    @PostMapping("")
    ResponseEntity<?> createManager(@RequestBody CreateManagerRequestDTO request) {
        Manager manager = managerService.createManager(ManagerDTO.builder()
                .id(request.getId())
                .nickname(request.getNickname())
                .password(request.getPassword())
                .img(request.getImg())
                .build());
        CreateManagerResponseDTO response = CreateManagerResponseDTO.builder()
                .managerTsid(String.valueOf(manager.getManagerTsid()))
                .build();
        return ResponseEntity.ok(response);
    }

    //TODO: JWT 토큰을 통한 조회 @PathVarialbe => @ManagerTsid
    @GetMapping("/me")
    ResponseEntity<?> getMyInfo() {
        long managerTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        Manager response = managerService.getManager(managerTsid);
        return ResponseEntity.ok(ReadManagerResponseDTO.builder()
                .managerTsid(String.valueOf(response.getManagerTsid()))
                .nickname(response.getNickname())
                .img(response.getImg())
                .build());
    }

    //TODO: 위와 같은 JWT 토큰을 통한 조회 @PathVarialbe => @ManagerTsid
    @GetMapping("/me/popups")
    ResponseEntity<?> getMyPopups() {
        long managerTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        //TODO: popupService findByID 구현
        List<PopupDTO> popups = popupService.getAllPopupByManager(managerTsid);
        return ResponseEntity.ok(popups);
    }

    @GetMapping("/{nickname}/nickname-check")
    ResponseEntity<?> checkNickname(@PathVariable String nickname) {
        managerService.checkNickname(nickname);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/id-check")
    ResponseEntity<?> checkId(@PathVariable String id) {
        managerService.checkId(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{managerTsid}")
    ResponseEntity<?> getManager(@PathVariable Long managerTsid) {
        Manager manager =  managerService.getManager(managerTsid);
        return ResponseEntity.ok(ManagerDTO.builder()
                .managerTsid(String.valueOf(manager.getManagerTsid()))
                .id(manager.getId())
                .password(manager.getPassword())
                .nickname(manager.getNickname())
                .img(manager.getImg())
                .build());
    }

    @PutMapping("/{managerTsid}")
    ResponseEntity<?> updateManager(@PathVariable Long managerTsid, @RequestBody UpdateManagerRequestDTO request) {
        managerService.updateManager(managerTsid, ManagerDTO.builder()
                .nickname(request.getNickname())
                .password(request.getPassword())
                .img(request.getImg())
                .build());
        Manager manager = managerService.getManager(managerTsid);
        UpdateManagerResponseDTO response = UpdateManagerResponseDTO.builder()
                .managerTsid(String.valueOf(manager.getManagerTsid()))
                .build();
        return ResponseEntity.ok(response);
    }

    //TODO: Admin 권한 확인 후 매니저 삭제
    @DeleteMapping("/{managerTsid}")
    ResponseEntity<?> deleteManager(@PathVariable Long managerTsid) {
        managerService.deleteManager(managerTsid);
        return ResponseEntity.ok().build();
    }
}
