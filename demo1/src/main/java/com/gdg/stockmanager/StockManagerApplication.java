package com.gdg.stockmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 최종 애플리케이션 구동 Main클래스
@SpringBootApplication
public class StockManagerApplication
{
    public static void main(String[] argv)
    {
        SpringApplication.run(StockManagerApplication.class, argv);
    }
}
