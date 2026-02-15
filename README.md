# 이어주다

청각장애인을 위한 개인 맞춤형 대화 보조 및 알림 서비스
Android / Wear OS 연동 기반 음성 인식 애플리케이션

> SSAFY(삼성 SW 아카데미) 과정 프로젝트이며, 당시 배포·도메인은 현재 운영되지 않습니다.

## 📌 제작 인원 & 기간

- Frontend 3명, Backend 1명, AI 2명 (총 6명)
- 2024.10.14 ~ 2024.11.19 (총 6주)

## 📱 프로젝트 개요

**이어주다**는 청각장애인을 위한 실시간 대화 보조 및 알림 기능을 제공하는 서비스입니다.

상대방의 음성을 텍스트로 변환(STT)하고, 대화 흐름을 기반으로 예상 답변을 추천하며, 사용자가 선택한 답변을 TTS로 출력해 빠르고 자연스러운 의사소통을 돕습니다.

또한 다양한 생활 소리를 감지하여 진동 및 화면 알림으로 전달합니다.

## ✨ 주요 기능

- STT / TTS 기반 음성 인식 및 출력
- 대화 흐름 기반 예상 답변 추천
- 단어 교체 추천 기능
- 상황별 알림 및 등록 단어 알림
- 워치 – 모바일 연동 텍스트 전송
- 대화 내용 저장

## 🖼️ 서비스 화면

### 🎙️ 음성 인식 (STT)

| Watch | Mobile |
| ----- | ----- |
| <video src="images/connectWatchSTT.mp4" controls width="240"></video> | <video src="images/connectPhoneSTT.mp4" controls width="240"></video> |

상대방 음성을 실시간으로 텍스트로 변환하여 화면에 출력합니다.

### 💬 답변 추천

| Watch | Mobile |
| ----- | ----- |
| <video src="images/connectWatchRecommend.mp4" controls width="240"></video> | <video src="images/connectPhoneRecommend.mp4" controls width="240"></video> |

인식된 음성을 기반으로 대화 흐름에 맞는 예상 답변을 추천합니다.

### 🔄 단어 교체

| Watch | Mobile |
| ----- | ----- |
| <video src="images/connectWatchChange.mp4" controls width="240"></video> | <video src="images/connectPhoneChange.mp4" controls width="240"></video> |

생성된 답변의 단어를 빠르게 교체할 수 있으며  
과거 대화 데이터를 기반으로 추천됩니다.

### 📜 대화 목록

| Watch | Mobile |
| ----- | ----- |
| <video src="images/connectWatchList.mp4" controls width="240"></video> | <video src="images/connectPhoneList.mp4" controls width="240"></video> |

이전 대화 기록을 확인할 수 있습니다.

### 🔔 이름 알림

| Watch | Mobile |
| ----- | ----- |
| <video src="images/connectWatchAlarmName.mp4" controls width="240"></video> | <video src="images/connectPhoneAlarmName.mp4" controls width="240"></video> |

사용자의 이름이나 별명을 부르면 진동과 함께 알림을 제공합니다.

## 🧑‍💻 담당 역할

**UI/UX 기획 · Frontend(워치 기능) · 팀장 · 발표**

- STT 기능 적용 → 음성 텍스트 출력
- 답변 생성 API 연동
- 단어 추천 및 교체 기능 구현
- 선택 문장 TTS 출력
- 상황별 소리 감지 알림 구현

## 🛠 기술 스택

- Kotlin (Android & Wear OS)
- OpenAI
- Neo4j
- Pinecone
- Google STT
- TTS

## 📖 프로젝트 회고

Wear OS 환경에서의 제한된 화면 크기와 동작만으로 정보를 효과적으로 전달하기 위해 직관적인 UI 설계에 많은 신경을 썼습니다. 복잡한 흐름보다 사용자가 빠르게 이해하고 반응할 수 있도록, 구성 요소의 배치와 흐름, 피드백 방식을 반복적으로 검토하고 개선했습니다.

실제 사용자 인터뷰를 통해 "실제로 도움이 된다"는 말을 들었을 때 가장 큰 보람을 느꼈고, 그 한마디가 프로젝트에 더 집중할 수 있는 원동력이 되었습니다. 청각장애인 입장에서 어떤 흐름이 자연스러울지, 어떤 표현 방식이 더 이해하기 쉬울지를 고민하며 UI/UX를 설계했습니다. 기능 구현을 넘어, 누군가의 일상에 실질적인 도움을 줄 수 있는 앱을 만들었다는 점에서 개발자로서 큰 뿌듯함을 느낄 수 있었습니다.

### ✔️ 개발 역량 및 새롭게 배운 기술

- Kotlin 기반 Wear OS 개발 경험(Jetpack Compose)
- STT, TTS 기반 인터랙션 구현 경험
- 실시간 데이터 처리 흐름에 맞는 UI 설계 및 최적화
- 사용자 피드백 기반 기능 개선 경험

### ✔️ 깨달은 점

청각장애인을 위한 서비스이기에 UI 구성과 기능 부분에서 상황을 더 깊이 고려해야 한다는 것을 느꼈습니다. 음성의 빠르기, 텍스트 출력의 명확성, 단어 호출 속도의 개선 등 실제 사용자 중심 설계가 곧 기능 이상의 가치를 만든다는 점을 배웠습니다. 사용자에게 실질적인 도움이 되는 서비스를 만든다는 것이 개발자로서 얼마나 큰 동기와 책임감을 줄 수 있는지를 깨달았습니다.
