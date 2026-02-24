package com.apink.poppin.api.manager.service;

import com.apink.poppin.api.manager.dto.ManagerDTO;
import com.apink.poppin.api.manager.entity.Manager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@Transactional
class ManagerServiceImplTest {

    @Autowired
    private ManagerServiceImpl managerService;

    @Test
    @DisplayName("매니저 조회")
    void getManager() {
        // Given
        Long managerTsid = 1L;
        // When
        Manager manager = managerService.getManager(managerTsid);
        // Then
        System.out.println(manager.getManagerTsid());
        System.out.println(manager.getNickname());
        System.out.println(manager.getId());
        System.out.println(manager.getPassword());
        System.out.println(manager.getImg());
        assertEquals(manager.getManagerTsid(), managerTsid);
    }

    @Test
    @DisplayName("매니저 수정")
    void updateManager() {
        // Given
        Long managerTsid = 1L;
        ManagerDTO managerDTO = ManagerDTO.builder()
                .managerTsid(1L)
                .nickname("nickname")
                .password("password")
                .img("img")
                .build();
        // When
        managerService.updateManager(managerTsid, managerDTO);
        // Then
        Manager manager = managerService.getManager(managerTsid);
        System.out.println(manager.getManagerTsid());
        System.out.println(manager.getNickname());
        System.out.println(manager.getId());
        System.out.println(manager.getPassword());
        System.out.println(manager.getImg());
        assertEquals(managerService.getManager(managerTsid).getNickname(), managerDTO.getNickname());
    }

    @Test
    @DisplayName("매니저 삭제")
    void deleteManager() {
        // Given
        Long managerTsid = 1L;
        // When
        managerService.deleteManager(managerTsid);
        // Then
        Manager manager = managerService.getManager(managerTsid);
        System.out.println(manager.getState());
        assertFalse(manager.getState());
    }

    @Test
    @DisplayName("매니저 리스트 조회")
    void getManagerList() {
        // Given
        // When
        List<Manager> managerList = managerService.getManagerList();
        // Then
        for (Manager manager : managerList) {
            System.out.println(manager.getManagerTsid());
            System.out.println(manager.getNickname());
            System.out.println(manager.getId());
            System.out.println(manager.getImg());
        }
    }

    @Test
    @DisplayName("이미 중복된 닉네임")
    void checkExistNickname() {
        // Given
        String nickname = "nickname";
        // When
        // Then
        assertThrows(IllegalArgumentException.class, () -> managerService.checkNickname(nickname));
    }

    @Test
    @DisplayName("중복X 닉네임")
    void checkNotExistNickname() {
        // Given
        String nickname = "nidea";
        // When
        // Then
        assertThrows(IllegalArgumentException.class, () -> managerService.checkNickname(nickname));
    }

    @Test
    @DisplayName("이미 중복된 아이디")
    void checkExistId() {
        // Given
        String id = "김싸피";
        // When
        // Then
        assertThrows(IllegalArgumentException.class, () -> managerService.checkNickname(id));
    }
    @Test
    @DisplayName("중복X 아이디")
    void checkNotExistId() {
        // Given
        String id = "sfklasjeflak";
        // When
        // Then
        assertThrows(IllegalArgumentException.class, () -> managerService.checkNickname(id));
    }

}