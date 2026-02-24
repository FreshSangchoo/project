package com.apink.poppin.api.popup.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;


    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }


    public String storeFile(MultipartFile file) {
        try {

            if (file == null || file.isEmpty()) {
                return null;
            }
            // 파일의 원래 이름을 가져옴
            String originalFileName = file.getOriginalFilename();
            // if(originalFileName.equals("/uploads/profile.png)) {
            //     return "IMG_URL";
            // }

            // UUID를 사용하여 고유한 파일 이름 생성
            String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;

            // 고유한 파일 이름을 포함한 경로 생성
            Path copyLocation = Paths.get(uploadDir + "/" + uniqueFileName);

            // 파일을 지정된 위치에 저장
            Files.copy(file.getInputStream(), copyLocation, StandardCopyOption.REPLACE_EXISTING);

            return copyLocation.toString();
        } catch (IOException e) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename() + ". Please try again!", e);
        }

    }


    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Could not delete file " + filePath + ". Please try again!", e);
        }
    }

}
