package com.studymate.studymate.controller;

import com.studymate.studymate.entity.Notification;
import com.studymate.studymate.entity.Study;
import com.studymate.studymate.entity.User;
import com.studymate.studymate.repository.NotificationRepository;
import com.studymate.studymate.repository.StudyRepository;
import com.studymate.studymate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Map;

@RestController
@RequestMapping("/api/studies")
public class StudyController {

    @Autowired
    private StudyRepository studyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private String nameOf(String userId) {
        return userRepository.findById(userId).map(User::getName).orElse(userId);
    }

    @PostMapping
    public ResponseEntity<Study> createStudy(@RequestBody Study study) {
        if (study.getParticipantIds() == null) {
            study.setParticipantIds(new ArrayList<>());
        }
        if (study.getTagList() == null) {
            study.setTagList(new ArrayList<>());
        }
        if (study.getWishlistedUserIds() == null) {
            study.setWishlistedUserIds(new ArrayList<>());
        }
        if (study.getCurrentParticipants() == null) {
            study.setCurrentParticipants(1);
        }
        if (study.getStatus() == null) {
            study.setStatus("모집중");
        }
        if (study.getCreatorId() != null && !study.getParticipantIds().contains(study.getCreatorId())) {
            study.getParticipantIds().add(study.getCreatorId());
        }
        Study savedStudy = studyRepository.save(study);
        return new ResponseEntity<>(savedStudy, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Study>> getAllStudies(
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category) {

        List<Study> studies = studyRepository.findAll();

        if (category != null && !category.trim().isEmpty() && !category.equals("전체")) {
            studies = studies.stream()
                    .filter(s -> s.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            studies = studies.stream()
                    .filter(s -> s.getTitle().toLowerCase().contains(lowerKeyword) ||
                            s.getIntroduction().toLowerCase().contains(lowerKeyword) ||
                            s.getTagList().stream().anyMatch(t -> t.toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
        }

        if (status != null && !status.trim().isEmpty() && !status.equals("전체")) {
            studies = studies.stream()
                    .filter(s -> s.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (sort != null) {
            if (sort.equals("최신순")) {
                studies = studies.stream()
                        .sorted(Comparator.comparing(Study::getId).reversed())
                        .collect(Collectors.toList());
            } else if (sort.equals("시간순")) {
                studies = studies.stream()
                        .sorted(Comparator.comparing(Study::getTimeInfo))
                        .collect(Collectors.toList());
            }
        }

        return ResponseEntity.ok(studies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Study> getStudyById(@PathVariable Long id) {
        return studyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> applyStudy(@PathVariable Long id, @RequestParam String userId) {
        return studyRepository.findById(id).map(study -> {
            if (study.getParticipantIds().contains(userId)) {
                return ResponseEntity.badRequest().body("이미 참여 중인 스터디입니다.");
            }
            if (study.getPendingUserIds().contains(userId)) {
                return ResponseEntity.badRequest().body("이미 신청한 스터디입니다.");
            }
            if ("마감".equals(study.getStatus())) {
                return ResponseEntity.badRequest().body("모집이 마감된 스터디입니다.");
            }
            if (userId.equals(study.getCreatorId())) {
                return ResponseEntity.badRequest().body("본인이 만든 스터디입니다.");
            }
            study.getPendingUserIds().add(userId);
            studyRepository.save(study);

            notificationRepository.save(Notification.builder()
                    .userId(study.getCreatorId())
                    .type("APPLY_RECEIVED")
                    .message("방장님! '" + study.getTitle() + "' 스터디 방에 " + nameOf(userId) + "님이 참여 신청을 하였습니다.")
                    .relatedStudyId(study.getId())
                    .build());

            return ResponseEntity.ok(study);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/wish")
    public ResponseEntity<?> toggleWishlist(@PathVariable Long id, @RequestParam String userId) {
        return studyRepository.findById(id).map(study -> {
            if (study.getWishlistedUserIds().contains(userId)) {
                study.getWishlistedUserIds().remove(userId);
            } else {
                study.getWishlistedUserIds().add(userId);
            }
            studyRepository.save(study);
            return ResponseEntity.ok(study);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 승인
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id,
            @RequestParam String creatorId,
            @RequestParam String userId) {
        return studyRepository.findById(id).map(study -> {
            if (!creatorId.equals(study.getCreatorId())) {
                return ResponseEntity.status(403).body("방장만 승인할 수 있습니다.");
            }
            if (!study.getPendingUserIds().contains(userId)) {
                return ResponseEntity.badRequest().body("대기 중인 사용자가 아닙니다.");
            }
            study.getPendingUserIds().remove(userId);
            study.getParticipantIds().add(userId);
            study.setCurrentParticipants(study.getCurrentParticipants() + 1);
            if (study.getCurrentParticipants().equals(study.getMaxParticipants())) {
                study.setStatus("마감");
            }
            studyRepository.save(study);

            notificationRepository.save(Notification.builder()
                    .userId(userId)
                    .type("APPLY_APPROVED")
                    .message(nameOf(userId) + "님! '" + study.getTitle() + "' 스터디 방에 참여하셨습니다! 스터디 방에서 다른 멤버들과 인사를 나눠보세요.")
                    .relatedStudyId(study.getId())
                    .build());

            return ResponseEntity.ok(study);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 거절
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id,
            @RequestParam String creatorId,
            @RequestParam String userId) {
        return studyRepository.findById(id).map(study -> {
            if (!creatorId.equals(study.getCreatorId())) {
                return ResponseEntity.status(403).body("방장만 거절할 수 있습니다.");
            }
            study.getPendingUserIds().remove(userId);
            studyRepository.save(study);
            return ResponseEntity.ok(study);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 강제 내보내기
    @PostMapping("/{id}/kick")
    public ResponseEntity<?> kickUser(@PathVariable Long id,
            @RequestParam String creatorId,
            @RequestParam String userId) {
        return studyRepository.findById(id).map(study -> {
            if (!creatorId.equals(study.getCreatorId())) {
                return ResponseEntity.status(403).body("방장만 내보낼 수 있습니다.");
            }
            study.getParticipantIds().remove(userId);
            study.setCurrentParticipants(study.getCurrentParticipants() - 1);
            if ("마감".equals(study.getStatus())) {
                study.setStatus("모집중");
            }
            studyRepository.save(study);
            return ResponseEntity.ok(study);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 추천
    @GetMapping("/categories/stats")
    public ResponseEntity<?> getCategoryStats() {
        List<Study> studies = studyRepository.findAll();
        Map<String, Long> stats = studies.stream()
                .collect(Collectors.groupingBy(Study::getCategory, Collectors.counting()));
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudy(@PathVariable Long id, @RequestParam String creatorId) {
        return studyRepository.findById(id).map(study -> {
            if (!creatorId.equals(study.getCreatorId())) {
                return ResponseEntity.status(403).body("방장만 삭제할 수 있습니다.");
            }
            studyRepository.delete(study);
            return ResponseEntity.ok("삭제 완료");
        }).orElse(ResponseEntity.notFound().build());
    }

}