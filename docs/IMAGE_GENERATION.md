# 이미지 생성 규칙

이 문서는 CloToon의 Gemini 이미지 생성 계약을 정의합니다. 목표는 생성 모델이 배경, 캐릭터, 장면으로 이루어진 `생성 아트 레이어`를 만들고, 사용자가 입력한 `자막`과 `대사`는 최종 HTML/CSS 레이어에서 정확히 렌더링되도록 유지하는 것입니다.

## 핵심 용어

- `생성 아트 레이어`: Gemini가 생성하는 순수 이미지입니다. 배경, 캐릭터, 소품, 구도, 감정, 연출을 포함하지만 읽을 수 있는 텍스트는 포함하지 않습니다.
- `텍스트 오버레이`: 사용자가 입력한 자막과 대사를 HTML/CSS로 얹는 레이어입니다. 최종 컷에서 정확한 문구를 보장하는 책임을 가집니다.
- `최종 컷`: 생성 아트 레이어 위에 텍스트 오버레이를 합성한 미리보기/export 결과입니다.

## 사용자 흐름

1. 사용자는 `Assets > API`에서 Gemini API Key를 등록하고 이미지 모델을 선택합니다.
2. 사용자는 `Assets > 캐릭터`에서 캐릭터 이름, 캐릭터 설명 Markdown, 캐릭터 표정 이미지를 등록합니다.
3. 사용자는 `Assets > 배경`에서 기본 배경 프롬프트와 배경 색상을 등록합니다.
4. 사용자는 프로젝트에서 컷 시나리오, 자막, 대사, 이미지 프롬프트를 작성합니다.
5. 사용자가 `이미지 생성`을 누를 때만 로컬 API route가 Gemini를 호출합니다.
6. Gemini 결과는 컷의 `imageDataUrl`로 저장되고, 자막과 대사는 기존 HTML/CSS 레이어로 표시됩니다.

## 모델 선택 계약

- 생성 API는 요청 body의 `model`을 필수로 받습니다.
- UI는 `local-studio-settings.geminiModel`에 저장된 사용자의 선택 모델을 요청에 포함해야 합니다.
- 모델이 누락되었거나 지원 목록에 없으면 fallback 없이 설정 필요 오류를 반환합니다.
- prompt 문자열에는 모델명이나 모델 선택 지시를 넣지 않습니다. 모델 선택은 API 요청 메타데이터의 책임입니다.

## 입력 데이터 역할

- `project`: 콘텐츠 유형과 캔버스 비율을 제공합니다.
- `assets.characters`: 캐릭터 일관성을 위한 기준입니다. Markdown은 캐릭터 설정의 주 자료이고, 표정 이미지는 identity와 표정 참고 자료입니다.
- `assets.background`: 기본 배경 지시입니다. 컷 이미지 프롬프트가 배경을 명시적으로 덮어쓰면 컷 지시를 우선합니다.
- `cut.scenario`: 장면의 사건, 행동, 감정, 맥락을 설명합니다.
- `cut.caption`: 최종 컷의 자막 오버레이입니다. 모델에는 장면 이해용 맥락으로만 전달합니다.
- `cut.dialogue`: 최종 컷의 대사 오버레이입니다. 모델에는 캐릭터 감정과 연출 맥락으로만 전달합니다.
- `cut.imagePrompt`: 실제 장면 연출의 최우선 시각 지시입니다.

## Prompt 규칙

모든 prompt는 다음 원칙을 지켜야 합니다.

- Gemini에게 생성 아트 레이어만 만들라고 지시합니다.
- 자막과 대사는 `overlay context only`로 설명하고, 이미지 안에 그리지 말라고 명시합니다.
- 캐릭터 Markdown과 표정 이미지는 캐릭터 일관성 참고 자료로 사용합니다.
- 기본 배경은 Assets 배경을 사용하되, 컷 이미지 프롬프트의 명시 지시가 있으면 컷 지시를 우선합니다.
- 자막/대사를 나중에 HTML/CSS로 올릴 수 있도록 여백과 구도를 고려하게 합니다.
- 모델명, 가격, quota, 인증 방식은 prompt에 넣지 않습니다.

모든 prompt에는 아래 금지 규칙을 포함해야 합니다.

```text
No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue inside the generated image.
```

## 텍스트 처리 원칙

- 자막과 대사는 최종 컷에 반드시 표시되어야 합니다.
- 정확한 문구는 Gemini 픽셀에 굽지 않고 HTML/CSS 오버레이로 표현합니다.
- 이미지 안에 말풍선, 제목 박스, 표지판, UI 텍스트, 워터마크, 로고, 한국어 글자를 생성하게 하지 않습니다.
- 사용자가 이미지 프롬프트에 텍스트가 필요한 듯한 표현을 쓰더라도, 앱의 기본 계약은 “텍스트는 오버레이”입니다.

## 저장과 개인정보

- Gemini API Key는 SQLite DB, 코드, 문서, 로그, git에 저장하지 않습니다.
- 브라우저는 `local-studio-settings.geminiApiKey`에서 key를 읽고 현재 생성 요청에만 사용합니다.
- 캐릭터 Markdown과 표정 이미지는 사용자가 이미지 생성을 누를 때만 Gemini 요청에 포함됩니다.
- 표정 이미지는 허용된 PNG/JPEG/WebP data URL만 제한된 개수로 전송합니다.
- 런타임에서 중간 Markdown 파일을 생성하지 않습니다.
- 생성 결과는 선택 컷에 `imageDataUrl`과 `imageStatus: "generated"`로 저장합니다.

## 실패 처리

- API Key가 없으면 workspace UI에서 먼저 안내하고 Gemini 호출을 보내지 않습니다.
- 이미지 모델이 없거나 지원되지 않으면 설정 필요 오류를 보여줍니다.
- quota 오류는 Google AI Studio의 billing/quota 확인을 안내합니다.
- API key 오류는 key 재확인을 안내합니다.
- mock 이미지와 업로드 흐름은 외부 인증 없이 사용할 수 있는 로컬 대체 경로로 유지합니다.
