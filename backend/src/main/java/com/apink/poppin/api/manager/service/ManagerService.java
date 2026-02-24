package com.apink.poppin.api.manager.service;

import com.apink.poppin.api.manager.dto.ManagerDTO;
import com.apink.poppin.api.manager.entity.Manager;

import java.util.List;

public interface ManagerService {
    Manager createManager(ManagerDTO managerDTO);
    void updateManager(Long managerTsid, ManagerDTO managerDTO);
    void deleteManager(Long managerTsid);
    Manager getManager(Long managerTsid);
    List<Manager> getManagerList();
    void checkNickname(String nickname);
    void checkId(String id);
}
