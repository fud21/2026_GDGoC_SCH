package com.gdg.stockmanager.service;

import com.gdg.stockmanager.domain.AppUser;
import com.gdg.stockmanager.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void signup(String username, String password) {
        String normalizedUsername = normalizeUsername(username);

        if (password == null || password.length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters.");
        }

        if (appUserRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("Username already exists.");
        }

        AppUser appUser = new AppUser(
                normalizedUsername,
                passwordEncoder.encode(password),
                "USER"
        );

        appUserRepository.save(appUser);
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }

        return username.trim().toLowerCase();
    }
}
