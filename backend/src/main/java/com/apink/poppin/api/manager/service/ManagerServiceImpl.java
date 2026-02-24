package com.apink.poppin.api.manager.service;

import com.apink.poppin.api.manager.dto.ManagerDTO;
import com.apink.poppin.api.manager.entity.Manager;
import com.apink.poppin.api.manager.repository.ManagerRepository;
import com.apink.poppin.common.util.SnowflakeTsidUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ManagerServiceImpl implements ManagerService {

    private final ManagerRepository managerRepository;
    private final SnowflakeTsidUtil snowflakeTsidUtil;

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    BCryptPasswordEncoder bCryptPasswordEncoder = bCryptPasswordEncoder();

    public ManagerServiceImpl(ManagerRepository managerRepository, SnowflakeTsidUtil snowflakeTsidUtil) {
        this.managerRepository = managerRepository;
        this.snowflakeTsidUtil = snowflakeTsidUtil;
    }

    @Override
    @Transactional
    public Manager createManager(ManagerDTO managerDTO) {
        String id = managerDTO.getId();
        String nickname = managerDTO.getNickname();

        checkId(id);
        checkNickname(nickname);

        Manager manager = Manager.builder()
                .managerTsid(snowflakeTsidUtil.nextId())
                .nickname(managerDTO.getNickname())
                .id(managerDTO.getId())
                .password(bCryptPasswordEncoder.encode(managerDTO.getPassword()))
                .img(managerDTO.getImg())
                .state(true)
                .build();

        return managerRepository.save(manager);
    }

    @Override
    @Transactional
    public void updateManager(Long managerTsid, ManagerDTO managerDTO) {
        Manager manager = managerRepository.findById(managerTsid).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매니저입니다."));
        Manager newManager = Manager.builder()
                .managerTsid(managerTsid)
                .nickname(managerDTO.getNickname() == null ? manager.getNickname() : managerDTO.getNickname())
                .id(managerDTO.getId() == null ? manager.getId() : managerDTO.getId())
                .password(managerDTO.getPassword() == null ? manager.getPassword() : managerDTO.getPassword())
                .img(managerDTO.getImg() == null ? manager.getImg() : managerDTO.getImg())
                .build();
        managerRepository.save(newManager);
    }

    @Override
    @Transactional
    public void deleteManager(Long managerTsid) {
        Manager manager = managerRepository.findById(managerTsid).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매니저입니다."));
        Manager newManager = Manager.builder()
                .managerTsid(managerTsid)
                .nickname(manager.getNickname())
                .id(manager.getId())
                .password(manager.getPassword())
                .img(manager.getImg())
                .state(false)
                .build();
        managerRepository.save(newManager);
    }

    @Override
    @Transactional(readOnly = true)
    public Manager getManager(Long managerTsid) {
        return managerRepository.findById(managerTsid).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매니저입니다."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Manager> getManagerList() {
        return managerRepository.findAll()
                .stream()
                .filter(Manager::getState)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public void checkNickname(String nickname) {
        boolean isExist = managerRepository.existsByNickname(nickname);
        if(isExist) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkId(String id) {
        boolean isExist = managerRepository.existsById(id);

    if(isExist) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
    }
}
