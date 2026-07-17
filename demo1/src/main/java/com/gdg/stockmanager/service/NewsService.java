package com.gdg.stockmanager.service;

import com.gdg.stockmanager.dto.NewsDto;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NewsService {
    // 뉴스 목록 반환 메서드
    public List<NewsDto> getNews() {

        // 결과 저장 리스트
        List<NewsDto> newsList = new ArrayList<>();

        try {
            // 네이버Pay 증권 뉴스페이지 주소
            String url = "https://finance.naver.com/news/mainnews.naver";

            //해당 웹사이트에 접속 + HTML 전체를 가져옴
            Document doc = Jsoup.connect(url).get();

            //css 선택자 사용 : a태그선택
            Elements articles = doc.select(".articleSubject a");

            int count = 0;

            //기사 태그 하나씩 반복
            for (Element article : articles) {
                //기사 제목 가져오기
                String title = article.text();
                //href 속성 가져오기
                String link =
                        "https://finance.naver.com"
                                + article.attr("href");
                //dto 객체 생성 후 리스트 추가
                newsList.add(new NewsDto(title, link));

                count++;
                //3개 까지만 가져오기
                if (count == 3) {
                    break;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return newsList;
    }
}
