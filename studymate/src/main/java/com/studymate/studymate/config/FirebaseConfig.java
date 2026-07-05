package com.studymate.studymate.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {


    @Value("${firebase.config-path}")
    private Resource firebaseResource;

    @PostConstruct
    public void initFirebase() {
        System.out.println("Firebase 초기화 시작...");
        try {
            // 1. 정상적으로 resources 폴더의 json 설정 파일을 읽어와 초기화 시도
            if (FirebaseApp.getApps().isEmpty()) {
                System.out.println("Firebase 앱 없음, 초기화 진행...");
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(firebaseResource.getInputStream()))
                        .build();
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase 초기화 성공!");
            }
        } catch (IOException e) {
            System.err.println("Firebase 서비스 계정 파일 로드 실패: " + e.getMessage());
            System.out.println("로컬 테스트용 기본 애플리케이션 자격 증명(Application Default Credentials)으로 폴백 모드를 실행합니다.");
            
            try {
                // 2. 만약 파일이 없으면 에러로 멈추지 않고, 시스템 기본 인증 체계를 통해 컨텍스트를 유지하도록 변경
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseOptions fallbackOptions = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .build();
                    FirebaseApp.initializeApp(fallbackOptions);
                }
            } catch (IOException ex) {
                System.err.println("Firebase 기본 자격 증명 로드 실패 (로컬 Mock 모드로 가동): " + ex.getMessage());
            }
        }
    }
}