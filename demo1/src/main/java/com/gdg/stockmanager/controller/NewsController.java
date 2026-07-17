package com.gdg.stockmanager.controller;

import com.gdg.stockmanager.dto.NewsDto;
import com.gdg.stockmanager.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class NewsController {

    @Autowired
    private NewsService newsService;

    @GetMapping("/stock")
    public String home(Model model) {

        List<NewsDto> newsList =
                newsService.getNews();

        model.addAttribute("newsList", newsList);

        return "stock/index";
    }
}
