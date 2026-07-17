package com.gdg.stockmanager.dto;

public class NewsDto {

    private String title;
    private String url;

    public NewsDto(String title, String url) {
        this.title = title;
        this.url = url;
    }

    public String getTitle() {
        return title;
    }

    public String getUrl() {
        return url;
    }
}
