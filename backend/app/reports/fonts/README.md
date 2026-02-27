# PDF 한글 폰트 (Noto Sans KR)

보고서 PDF에서 한글이 정상 표시되려면 이 폴더에 폰트 파일이 있어야 합니다.

**한 번만 실행하세요:**

```bash
# backend 폴더에서
python -m app.reports.download_fonts
```

또는 프로젝트 루트에서:

```bash
cd backend && python -m app.reports.download_fonts
```

실행 후 다음 파일이 생성됩니다:
- `NotoSansKR-VF.woff2` (한글 지원 변수 폰트)

폰트가 없으면 PDF의 한글이 □로 보일 수 있습니다.
