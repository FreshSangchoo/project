"""
PDF 한글 표시용 Noto Sans KR 폰트 다운로드.
한 번만 실행하면 됩니다. backend 또는 프로젝트 루트에서:
  python -m app.reports.download_fonts
"""
from __future__ import annotations

import urllib.request
from pathlib import Path

FONTS_DIR = Path(__file__).parent / "fonts"
# 단일 변수 폰트 (한글 지원); Regular/Bold 모두 이 파일 하나로 사용
FONTS = [
    (
        "NotoSansKR-VF.woff2",
        "https://akngs.github.io/noto-kr-vf-distilled/NotoSansKR-VF-distilled.woff2",
    ),
]


def main() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in FONTS:
        path = FONTS_DIR / name
        if path.exists():
            print(f"이미 있음: {path}")
            continue
        print(f"다운로드 중: {name} ...")
        try:
            urllib.request.urlretrieve(url, path)
            print(f"  저장됨: {path}")
        except Exception as e:
            print(f"  실패: {e}")


if __name__ == "__main__":
    main()
