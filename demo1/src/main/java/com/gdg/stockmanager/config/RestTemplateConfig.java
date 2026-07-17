package com.gdg.stockmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

// API 통신을 위한 RestTemplate 설정
@Configuration
public class RestTemplateConfig
{
    // 야후 파이낸스 API 호출 전용 RestTemplate 빈 등록
    @Bean(name = "yahooRestTemplate")
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
