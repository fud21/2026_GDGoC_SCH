package com.studymate.studymate.service;

import com.studymate.studymate.entity.Inquiry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.admin-email}")
    private String adminEmail;

    public void sendInquiryReceivedMail(Inquiry inquiry, String submitterEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("[StudyMate 문의] " + inquiry.getTitle());
        message.setText(
                "문의자: " + submitterEmail + "\n\n" + inquiry.getContent());
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("문의 이메일 발송 실패: " + e.getMessage());
        }
    }
}
