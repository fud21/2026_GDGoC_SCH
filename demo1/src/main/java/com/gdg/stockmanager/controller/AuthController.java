package com.gdg.stockmanager.controller;

import com.gdg.stockmanager.service.AuthService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/signup")
    public String signup(
            @RequestParam String username,
            @RequestParam String password
    ) {
        try {
            authService.signup(username, password);
            return "redirect:/login.html?registered";
        } catch (IllegalArgumentException e) {
            return "redirect:/signup.html?error";
        }
    }
}
