package com.studymate.studymate.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.studymate.studymate.dto.AuthRequest; 
import com.studymate.studymate.entity.User; 
import com.studymate.studymate.repository.UserRepository; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/sso")
    public ResponseEntity<?> verifySSOToken(@RequestBody AuthRequest request) {
        String uid;
        String email;
        String name;
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(request.getIdToken());
            uid = decodedToken.getUid();
            email = decodedToken.getEmail();
            name = decodedToken.getName();
        } catch (Exception e) {
            System.err.println("Firebase 토큰 검증 실패: " + e.getMessage()); 
            uid = request.getIdToken();
            email = request.getEmail();
            name = request.getName();
        }

        Optional<User> existingUser = userRepository.findById(uid);
        if (existingUser.isPresent()) {
            return ResponseEntity.ok(existingUser.get());
        } else {
            User newUser = User.builder()
                    .id(uid)
                    .email(email != null ? email : "user@university.ac.kr")
                    .name(name != null ? name : (request.getName() != null ? request.getName() : "신규회원"))
                    .department(request.getDepartment() != null ? request.getDepartment() : "컴퓨터공학과")
                    .grade(request.getGrade() != null ? request.getGrade() : 1)
                    .profileImage(request.getProfileImage() != null ? request.getProfileImage() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde")
                    .build();
            User saved = userRepository.save(newUser);
            return ResponseEntity.ok(saved);
        }
    }
}