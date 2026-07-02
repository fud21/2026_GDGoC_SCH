from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import numpy as np

# 안녕하세요 반가워용 
# 여기 수정했습니다. 

@dataclass
class Paths:
    root: Path
    ext_csv: Path
    residual_dir: Path

@dataclass
class Protocol:
    ordered_labels: list[str] = field(default_factory=lambda: ["S1","O1","O2","R1","R2","O3","O4","R3","R4","S2"])

@dataclass
class FitConfig:
    fit_min_nm: float = 550.0
    fit_max_nm: float = 900.0
    downweight_575_605: float = 0.2
    downweight_nir_from_nm: float = 780.0
    downweight_nir_factor: float = 0.5

    use_baseline_projection: bool = True
    nmf_seed: int = 0
    nmf_max_iter: int = 2000
    nmf_init: str = "nndsvda"
    nmf_mode: str = "pos"   # residual_to_nonnegative 모드
    nmf_k: int = 2

    # 시각화 전용 (논문용 스무딩은 신중히)
    smooth_sigma_viz: float | None = None

def build_weight(wl_nm: np.ndarray, cfg: FitConfig) -> np.ndarray:
    w = np.ones_like(wl_nm, float)
    w[wl_nm < cfg.fit_min_nm] = 0.0
    w[wl_nm > cfg.fit_max_nm] = 0.0
    w[(wl_nm >= 575) & (wl_nm <= 605)] *= cfg.downweight_575_605
    w[wl_nm >= cfg.downweight_nir_from_nm] *= cfg.downweight_nir_factor
    return w
