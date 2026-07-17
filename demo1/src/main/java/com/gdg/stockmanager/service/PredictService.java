package com.gdg.stockmanager.service;

import ai.onnxruntime.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.io.File;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Collections;

@Service
public class PredictService {
    // ONNX 모델을 실행하기 위한 환경 객체와 세션 객체
    private final OrtEnvironment env;
    private final OrtSession session;

    public PredictService() {
        try {
            this.env = OrtEnvironment.getEnvironment();

            // 서버가 실행되는 시스템의 임시 디렉토리에 AI 모델용 가상 폴더 생성
            File tempDir = new File(System.getProperty("java.io.tmpdir"), "onnx_model");
            if (!tempDir.exists()) {
                tempDir.mkdirs();
            }

            // .onnx 파일과 .onnx.data 파일을 임시 폴더로 안전하게 복사
            File tempModelFile = new File(tempDir, "DLINEAR.onnx");
            File tempDataFile = new File(tempDir, "DLINEAR.onnx.data");

            // 리소스 디렉토리에서 읽어와 임시 파일로 복사 (이미 있으면 덮어쓰기)
            try (InputStream modelIs = new ClassPathResource("model/DLINEAR.onnx").getInputStream()) {
                Files.copy(modelIs, tempModelFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            try (InputStream dataIs = new ClassPathResource("model/DLINEAR.onnx.data").getInputStream()) {
                Files.copy(dataIs, tempDataFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            String safeModelPath = tempModelFile.getAbsolutePath();

            this.session = env.createSession(safeModelPath, new OrtSession.SessionOptions());
            System.out.println("====== [백엔드 알림] D-Linear AI 모델 및 대용량 가중치 파일 임시 로드 완료 ======");
            System.out.println("로딩된 임시 경로: " + safeModelPath);

        } catch (Exception e) {
            throw new IllegalStateException("AI 모델 파일(.onnx) 또는 가중치 파일(.data) 로드 중 실패했습니다.", e);
        }
    }

    /**
     * 최근 주가 배열을 입력받아 다음 날의 주가를 예측하는 메서드
     * @param inputPrices 최근 30일간의 주가 데이터 (정확히 30개의 배열 요소가 필요)
     * @return 예측된 다음 날 종가
     */
    public float predictNextPrice(float[] inputPrices) {
        // [방어 코드] 모델이 요구하는 정확한 데이터 개수(30일)를 검증합니다.
        if (inputPrices == null || inputPrices.length != 30) {
            System.err.println("[경고] D-Linear 모델은 정확히 30일치의 데이터가 필요합니다. (현재 입력된 길이: "
                    + (inputPrices != null ? inputPrices.length : 0) + ")");
            return 0.0f;
        }

        try {
            // AI 모델 규격에 맞게 3차원 차원(Shape)을 구성
            // 규격: [Batch_Size = 1, Sequence_Length = 30, Input_Dimension = 1]
            long[] shape = new long[]{1, 30, 1};

            // 일반 float 배열을 ONNX가 이해할 수 있는 버퍼(FloatBuffer) 형태로 포장
            FloatBuffer buffer = FloatBuffer.wrap(inputPrices);

            // 런타임 환경에 이 버퍼와 형태를 넘겨 인공지능용 데이터 묶음('텐서')을 생성
            OnnxTensor inputTensor = OnnxTensor.createTensor(env, buffer, shape);

            // 모델 실행. 입력 노드 이름 "input_ts"와 생성한 텐서를 매핑
            try (OrtSession.Result results = session.run(Collections.singletonMap("input_ts", inputTensor))) {

                // AI 모델이 연산 후 뱉어낸 출력값을 가져옴
                Object value = results.get(0).getValue();

                // 모델의 출력 차원에 맞춰 유연하게 첫 번째 종가 결과값을 반환
                if (value instanceof float[][][] outputValue) {
                    return outputValue[0][0][0]; // 3차원 출력일 경우 [[[ 종가 ]]]
                } else if (value instanceof float[][] outputValue) {
                    return outputValue[0][0];    // 2차원 출력일 경우 [[ 종가 ]]
                } else {
                    throw new IllegalStateException("예상치 못한 출력 텐서 구조입니다. 모델의 Output 형식을 확인하세요.");
                }
            }
        } catch (OrtException e) {
            System.err.println("AI 모델 연산 중 에러가 발생했습니다: " + e.getMessage());
            e.printStackTrace();
            return -1.0f;
        }
    }

    // 서버가 종료될 때 메모리에 올려둔 AI 세션 닫기 (메모리 누수 방지)
    @PreDestroy
    public void close() {
        try {
            if (session != null) session.close();
            if (env != null) env.close();
            System.out.println("====== [백엔드 알림] D-Linear AI 자원 반환 완료 ======");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}