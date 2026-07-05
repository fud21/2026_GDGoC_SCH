package com.studymate.studymate.dto;

import com.studymate.studymate.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileSummaryResponse {
    private User user;
    private long myStudyCount;
    private long wishStudyCount;
    private long applyStudyCount;
}