package com.apink.poppin.api.user.service;

import com.apink.poppin.api.heart.entity.Heart;
import com.apink.poppin.api.heart.repository.HeartRepository;
import com.apink.poppin.api.popup.dto.PopupDTO;
import com.apink.poppin.api.popup.entity.Category;
import com.apink.poppin.api.popup.entity.Popup;
import com.apink.poppin.api.popup.entity.PopupImage;
import com.apink.poppin.api.popup.repository.CategoryRepository;
import com.apink.poppin.api.popup.repository.PopupImageRepository;
import com.apink.poppin.api.popup.repository.PopupRepository;
import com.apink.poppin.api.popup.service.FileStorageService;
import com.apink.poppin.api.reservation.dto.OnsiteReservationRedisDto;
import com.apink.poppin.api.reservation.dto.PreReservationCancelledDto;
import com.apink.poppin.api.reservation.dto.PreReservationResponseDTO;
import com.apink.poppin.api.reservation.dto.ReservationResponseDto;
import com.apink.poppin.api.reservation.entity.PreReservation;
import com.apink.poppin.api.reservation.repository.OnsiteReservationRepository;
import com.apink.poppin.api.reservation.repository.PreReservationRepository;
import com.apink.poppin.api.review.dto.ReviewListDto;
import com.apink.poppin.api.review.entity.Review;
import com.apink.poppin.api.review.repository.ReviewRepository;
import com.apink.poppin.api.user.dto.UserDto;
import com.apink.poppin.api.user.entity.User;
import com.apink.poppin.api.user.entity.UserCategory;
import com.apink.poppin.api.user.entity.UserConsent;
import com.apink.poppin.api.user.repository.UserRepository;
import com.apink.poppin.common.exception.dto.BusinessLogicException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

import static com.apink.poppin.common.exception.dto.ExceptionCode.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String RESERVATION_KEY_PHONE = "ONSITE_BY_PHONE_";
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final PopupRepository popupRepository;
    private final HeartRepository heartRepository;
    private final ReviewRepository reviewRepository;
    private final PreReservationRepository preReservationRepository;
    private final OnsiteReservationRepository onsiteReservationRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ValueOperations<String, Object> valueOperations;
    private final CategoryRepository categoryRepository;
    private final PopupImageRepository popupImageRepository;

    @Override
    @Transactional(readOnly = true)
    public void verifyNicknameAvailable(String nickname) {
        isNicknameAvailable(nickname);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto.Response findUser(long userTsid) {
        User user = findByUserByUserTsid(userTsid);

        return convertToResponseDTO(user);
    }

    @Override
    @Transactional
    public UserDto.Response updateUser(UserDto.Put userDto, MultipartFile image) {
        String img = "/uploads/profile.png";
        try {
            img = fileStorageService.storeFile(image);

            long userTsid = Long.parseLong(userDto.getUserTsid());

            User findUser = userRepository.findUserByUserTsid(userTsid)
                    .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

            // Category 조회
            List<Category> categories = userDto.getUserCategories().stream()
                    .map(userCategoryDto -> categoryRepository.findByName(userCategoryDto.getName())
                            .orElseThrow(() -> new IllegalArgumentException("Invalid category name: " + userCategoryDto.getName())))
                    .toList();

            String oldImgPath = findUser.getImg();

            // 유저 정보, 카테고리 변경
            findUser.updateUser(userDto, img, categories);
            // 유저 동의 여부 변경
            findUser.getUserConsents().updateUserConsent(userDto.getUserConsents());

            userRepository.save(findUser);

            if (image != null && oldImgPath != null && !oldImgPath.equals("/uploads/profile.png")) {
                fileStorageService.deleteFile(oldImgPath);
            }

            return convertToResponseDTO(findUser);
        } catch (Exception e) {
            if (img != null && !img.equals("/uploads/profile.png")) {
                fileStorageService.deleteFile(img);
            }
            throw e;
        }
    }

    @Override
    @Transactional
    public void deleteUser(long userTsid) {
        User findUser = userRepository.findUserByUserTsid(userTsid)
                .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

        User user = User.builder()
                .userTsid(findUser.getUserTsid())
                .providerId("-" + findUser.getUserTsid())
                .providerName("-" + findUser.getUserTsid())
                .name("-" + findUser.getUserTsid())
                .nickname("-" + findUser.getUserTsid())
                .email("-" + findUser.getUserTsid())
                .age("-" + findUser.getUserTsid())
                .gender(findUser.getGender())
                .phoneNumber("-" + findUser.getUserTsid())
                .role(findUser.getRole())
                .img("default.img")
                .state(false)
                .build();

        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PopupDTO> findHeartPopup() {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());

        User user = userRepository.findUserByUserTsid(userTsid)
                        .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

        List<Heart> hearts = heartRepository.findByUser(user);
        List<PopupDTO> popupDtos = new ArrayList<>();

        for(int i = 0; i < hearts.size(); i++) {
            Heart heart = hearts.get(i);
            Popup popup = heart.getPopup();

            List<String> images = popupImageRepository.findAllByPopup_PopupId(popup.getPopupId())
                    .stream()
                    .sorted((img1, img2) -> Integer.compare(img1.getSeq(), img2.getSeq()))
                    .map(PopupImage::getImg)
                    .toList();

            PopupDTO popupDto = PopupDTO.builder()
                    .popupId(popup.getPopupId())
                    .name(popup.getName())
                    .startDate(popup.getStartDate())
                    .endDate(popup.getEndDate())
                    .hours(popup.getHours())
                    .snsUrl(popup.getSnsUrl())
                    .pageUrl(popup.getPageUrl())
                    .content(popup.getContent())
                    .description(popup.getDescription())
                    .address(popup.getAddress())
                    .lat(popup.getLat())
                    .lon(popup.getLon())
                    .heart(popup.getHeart())
                    .images(images)
                    .hit(popup.getHit())
                    .rating(popup.getRating())
                    .build();

            popupDtos.add(popupDto);
        }

        return popupDtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewListDto> findReviews() {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());

        User user = userRepository.findUserByUserTsid(userTsid)
                .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

        List<Review> reviews = reviewRepository.findByUser(user);

        return Optional.ofNullable(reviews)
                .orElse(Collections.emptyList())
                .stream()
                .map(review -> ReviewListDto.builder()
                        .reviewId(review.getReviewId())
                        .userTsid(userTsid)
                        .nickname(user.getNickname())
                        .img(user.getImg())
                        .rating(review.getRating())
                        .thumbnail(review.getThumbnail())
                        .title(review.getTitle())
                        .content(review.getContent())
                        .createdAt(review.getCreatedAt())
                        .build())
                .collect(Collectors.toList()
                );


    }

    @Override
    @Transactional(readOnly = true)
    public PreReservationResponseDTO findPreReservation(long prereservationId) {
        PreReservation pre = preReservationRepository.findById(prereservationId)
                .orElseThrow(() -> new RuntimeException("pre-reservation is null"));
        List<String> images = popupImageRepository.findAllByPopup_PopupId(pre.getPopup().getPopupId()).stream()
                .map(popupImage -> popupImage.getImg())
                .toList();

        return convertToReservationResponseDTO(pre, images.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponseDto> findReservations() {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());

        User user = userRepository.findUserByUserTsid(userTsid)
                .orElseThrow(() -> new BusinessLogicException(USER_NOT_FOUND));

        List<ReservationResponseDto> reservations = new ArrayList<>();;

        // 현장 예약 dto
        String keyByPhonePattern = RESERVATION_KEY_PHONE + user.getPhoneNumber();
        Set<String> keys = redisTemplate.keys(keyByPhonePattern + "*");
        assert keys != null;
        for (String key : keys) {
            Object obj = valueOperations.get(key);
            assert obj != null;
            if (obj instanceof OnsiteReservationRedisDto redisDto) {
                long popupId = redisDto.getPopupId();
                ReservationResponseDto reservationResponseDto
                        = popupRepository.findPopupNameAndFirstImageByPopupId(popupId);

                ReservationResponseDto reservation = ReservationResponseDto.builder()
                        .reservationId(redisDto.getOnsiteReservationRedisId())
                        .userName(redisDto.getName())
                        .popupId(redisDto.getPopupId())
                        .title(reservationResponseDto.getTitle())
                        .img(reservationResponseDto.getImg())
                        .reservationDate(redisDto.getVisitedDate())
                        .reservationCount(redisDto.getReservationCount())
                        .reservationStatement(redisDto.getReservationStatementId())
                        .kind(2)
                        .build();

                reservations.add(reservation);
            }
        }

        // 사전 예약 dto
        List<ReservationResponseDto> pres = preReservationRepository.findReservationsByUserTsid(user.getUserTsid());

        // 현장 예약 dto
        List<ReservationResponseDto> onsites = onsiteReservationRepository.findReservationsByPhoneNumber(user.getPhoneNumber());

        reservations.addAll(pres);
        reservations.addAll(onsites);

        return reservations;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreReservationCancelledDto> findCancelledPreReservations() {
        long userTsid = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());

        User user = userRepository.findUserByUserTsid(userTsid)
                .orElseThrow(() -> new RuntimeException("user not exists"));

        List<PreReservation> pres = preReservationRepository.findByUserAndReservationStatement_ReservationStatementId(user, 4L);

        return Optional.ofNullable(pres)
                .orElse(Collections.emptyList())
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    private void isNicknameAvailable(String nickname) {
        if(userRepository.existsByNickname(nickname)) {
            throw new BusinessLogicException(NICKNAME_EXIST);
        }
    }

    private User findByUserByUserTsid(long userTsid) {
        Optional<User> user = userRepository.findUserByUserTsid(userTsid);

        User findUser = user
                .orElseThrow(() -> new RuntimeException("User not found"));

        return findUser;
    }

    private UserDto.Response convertToResponseDTO(User user) {
        return UserDto.Response.builder()
                .userTsid(String.valueOf(user.getUserTsid()))
                .nickname(user.getNickname())
                .email(user.getEmail())
                .img(user.getImg())
                .phoneNumber(user.getPhoneNumber())
                .userCategories(user.getUserCategories().stream()
                        .map(this::convertToCategoryDTO)
                        .collect(Collectors.toList()))
                .userConsents(convertToConsentDTO(user.getUserConsents()))
                .build();
    }

    // DTO 변환
    private PreReservationCancelledDto convertToResponseDTO(PreReservation preReservation) {
        return PreReservationCancelledDto.builder()
                .preReservationId(preReservation.getPreReservationId())
                .userTsid(String.valueOf(preReservation.getUser().getUserTsid()))
                .popupId(preReservation.getPopup().getPopupId())
                .images(preReservation.getUser().getImg())
                .reservationDate(preReservation.getReservationDate())
                .reservationTime(preReservation.getReservationTime())
                .reservationCount(preReservation.getReservationCount())
                .createdAt(preReservation.getCreatedAt())
                .reservationStatementId(preReservation.getReservationStatement().getReservationStatementId())
                .build();
    }

    // DTO 변환
    private PreReservationResponseDTO convertToReservationResponseDTO(PreReservation preReservation, String img) {
        return PreReservationResponseDTO.builder()
                .preReservationId(preReservation.getPreReservationId())
                .userTsid(String.valueOf(preReservation.getUser().getUserTsid()))
                .popupId(preReservation.getPopup().getPopupId())
                .reservationDate(preReservation.getReservationDate())
                .reservationTime(preReservation.getReservationTime())
                .reservationCount(preReservation.getReservationCount())
                .createdAt(preReservation.getCreatedAt())
                .reservationStatementId(preReservation.getReservationStatement().getReservationStatementId())
                .img(img)
                .build();
    }



    private UserDto.Category convertToCategoryDTO(UserCategory userCategory) {
        return UserDto.Category.builder()
                .name(userCategory.getCategory().getName())
                .build();
    }

    private UserDto.Consent convertToConsentDTO(UserConsent userConsent) {
        return UserDto.Consent.builder()
                .marketingConsent(userConsent.getMarketingConsent())
                .servicePushConsent(userConsent.getServicePushConsent())
                .marketingUpdatedAt(userConsent.getMarketingUpdatedAt())
                .serviceUpdatedAt(userConsent.getServiceUpdatedAt())
                .build();
    }


}
