# 이미지 생성 규칙

이 문서는 CloToon의 Gemini 이미지 생성 계약을 정의합니다. 목표는 모델이 장면 이미지와 필요한 대사 말풍선을 만들고, 사용자가 계속 수정해야 하는 자막은 HTML/CSS 오버레이로 유지하는 것입니다.

## 핵심 정의

- `생성 이미지`: Gemini가 만드는 컷의 기본 이미지입니다. 캐릭터, 배경, 장면 연출, 감정, 필요한 대사 말풍선을 포함할 수 있습니다.
- `자막 오버레이`: 사용자가 입력한 `caption`을 앱이 HTML/CSS로 얹는 편집 가능한 하단 텍스트 영역입니다.
- `최종 컷`: 생성 이미지 위에 자막 오버레이를 합성해 미리보기와 PNG/ZIP export에 사용하는 결과입니다.

## 사용 흐름

1. 사용자는 `Assets > API`에서 Gemini API Key를 등록하고 이미지 모델을 선택합니다.
2. 사용자는 `Assets > 캐릭터`에서 캐릭터 이름, 캐릭터 설명 Markdown, 캐릭터 표정 이미지를 등록합니다.
3. 사용자는 `Assets > 배경`에서 기본 배경 프롬프트와 배경 색상을 등록합니다.
4. 사용자는 프로젝트에서 컷 시나리오, 자막, 대사, 이미지 프롬프트를 작성합니다.
5. 사용자가 `이미지 생성`을 누를 때만 로컬 API route가 Gemini를 호출합니다.
6. Gemini 결과는 컷의 `imageDataUrl`로 저장되고, 자막은 앱 오버레이로 렌더링합니다.

## 모델 선택 계약

- 생성 API 요청 body의 `model`은 필수입니다.
- UI는 `local-studio-settings.geminiImageModel`에 저장된 사용자의 선택 모델을 요청에 포함해야 합니다.
- 모델이 누락되었거나 지원 목록에 없으면 fallback 없이 설정 필요 오류를 반환합니다.
- prompt 문자열에는 모델명이나 모델 선택 지시를 넣지 않습니다. 모델 선택은 API 요청 메타데이터의 책임입니다.

## 입력 데이터 역할

- `project`: 콘텐츠 유형과 캔버스 비율을 제공합니다.
- `assets.characters`: 캐릭터 일관성 기준입니다. Markdown은 캐릭터 설정의 주 자료이고, 표정 이미지는 정체성과 표정 참고 자료입니다.
- `assets.background`: 기본 배경 지시입니다. 컷 이미지 프롬프트가 배경을 명시적으로 덮어쓰면 컷 지시를 우선합니다.
- `cut.scenario`: 장면의 사건, 행동, 감정, 맥락을 설명합니다.
- `cut.caption`: 최종 컷의 자막 오버레이입니다. 모델에는 장면 맥락으로만 전달하고 이미지 안에 그리지 않게 합니다.
- `cut.dialogue`: 캐릭터 대사입니다. 제공된 문구는 Gemini가 이미지 안의 말풍선으로 정확히 렌더링해야 합니다.
- `cut.imagePrompt`: 실제 장면 연출의 최우선 시각 지시입니다.

## Prompt 원칙

모든 prompt는 다음 원칙을 지켜야 합니다.

- 캐릭터 Markdown과 표정 이미지를 캐릭터 일관성 참고 자료로 사용합니다.
- 기본 배경은 Assets 배경을 사용하되, 컷 이미지 프롬프트의 명시 지시가 있으면 컷 지시를 우선합니다.
- 자막은 이미지 안에 굽지 않습니다. 앱이 편집 가능한 하단 자막 오버레이로 렌더링합니다.
- 대사는 제공된 문구가 있을 때만 이미지 안의 말풍선으로 렌더링합니다.
- 대사가 없으면 말풍선을 만들지 않습니다.
- 컬러 그라데이션 바, 패널 테두리, UI 텍스트, 워터마크, 로고, 임의의 한국어 글자를 만들지 않습니다.
- 모델명, 가격, quota, 인증 방식은 prompt에 넣지 않습니다.

모든 prompt에는 다음 금지 규칙을 포함합니다.

```text
No readable text other than the provided dialogue; no captions, subtitles, labels, signs, UI text, watermarks, logos, or random Korean lettering inside the generated image.
```

## 텍스트 처리 원칙

- 자막은 최종 컷에 반드시 보이지만 Gemini 픽셀이 아니라 HTML/CSS 오버레이로 표현합니다.
- 대사는 이미지 생성 모델이 말풍선과 함께 그립니다. 대사 수정 품질이 필요하면 이후 이미지 편집 기능에서 재생성하거나 부분 편집합니다.
- 사용자가 자막을 수정하면 이미지 재생성 없이 자막 오버레이만 즉시 바뀌어야 합니다.
- 사용자가 대사를 수정하면 현재 v1 구조에서는 이미지를 다시 생성해야 합니다.

## 저장과 개인정보

- Gemini API Key는 SQLite DB, 코드, 문서, 로그, git에 저장하지 않습니다.
- 브라우저의 `local-studio-settings.geminiApiKey`에서 key를 읽고 현재 생성 요청에만 사용합니다.
- 캐릭터 Markdown과 표정 이미지는 사용자가 `이미지 생성`을 누를 때만 Gemini 요청에 포함합니다.
- 표정 이미지는 허용된 PNG/JPEG/WebP data URL만 제한된 개수로 전송합니다.
- 프롬프트 생성을 위해 중간 Markdown 파일을 만들지 않습니다.
- 생성 결과는 선택 컷에 `imageDataUrl`과 `imageStatus: "generated"`로 저장합니다.

## 실패 처리

- API Key가 없으면 workspace UI에서 먼저 안내하고 Gemini 호출을 보내지 않습니다.
- 이미지 모델이 없거나 지원되지 않으면 설정 필요 오류를 보여줍니다.
- quota 오류는 Google AI Studio의 billing/quota 확인을 안내합니다.
- API key 오류는 key 재확인을 안내합니다.
- mock 이미지와 업로드 흐름은 외부 인증 없이 사용할 수 있는 로컬 대체 경로로 유지합니다.
