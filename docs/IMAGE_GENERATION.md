# 이미지 생성 프롬프트 규칙

이 문서는 CloToon의 Gemini 이미지 생성 프롬프트를 설계하고 검토하는 기준입니다. 목적은 컷별 배경 이미지를 안정적으로 생성하면서, 최종 자막과 대사는 기존 HTML/CSS 레이어에서 계속 수정 가능하게 유지하는 것입니다.

## 핵심 원칙

- 생성 대상은 최종 컷 전체가 아니라 `이미지 레이어`입니다.
- 자막, 대사, 제목, 말풍선, UI 텍스트는 이미지 안에 생성하지 않습니다.
- 자막과 대사는 장면 이해를 위한 맥락으로만 사용하고, 실제 표시는 HTML/CSS 미리보기 레이어가 담당합니다.
- 캐릭터 일관성은 캐릭터 이름, 캐릭터 설명 Markdown, 캐릭터 표정 이미지를 함께 사용해 유지합니다.
- 배경은 Assets의 기본 배경 설정을 기준으로 하되, 컷의 이미지 프롬프트가 더 구체적이면 컷 프롬프트를 우선합니다.
- 프롬프트는 길게 꾸미기보다 장면을 명확히 설명합니다. 주체, 행동, 장소, 구도, 조명, 스타일, 금지 조건이 분리되어야 합니다.

모든 생성 프롬프트에는 아래 금지 문구를 반드시 포함합니다.

```text
No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue inside the generated image.
```

## 입력 데이터

이미지 생성 route는 다음 데이터를 조합합니다.

- 프로젝트: 프로젝트 이름, 콘텐츠 유형, 캔버스 비율
- 컷: 컷 순서, 컷 시나리오, 자막, 대사, 이미지 프롬프트
- 에셋: 선택된 캐릭터, 캐릭터 설명 Markdown, 캐릭터 표정 이미지, 기본 배경 이름, 배경 프롬프트, 배경 색상
- 설정: Gemini API Key, 선택된 Gemini 이미지 모델

API Key는 요청 처리 중에만 사용합니다. 코드, DB, 문서, 로그, git에 저장하지 않습니다.

## 모델 선택 기준

기본 모델은 `gemini-3.1-flash-image-preview`입니다.

- `gemini-3.1-flash-image-preview`: 기본값. 속도, 비용, 품질 균형이 가장 좋고 일반 컷 생성에 적합합니다.
- `gemini-3-pro-image-preview`: 복잡한 장면, 정교한 구도, 많은 조건을 따라야 하는 컷에 사용합니다. 비용과 지연 시간이 더 클 수 있습니다.
- `gemini-2.5-flash-image`: 빠른 반복과 저지연 테스트에 사용합니다. 고품질 최종 컷보다 초안 확인에 적합합니다.

모델명, 가격, 할당량, 지원 해상도는 변동될 수 있으므로 구현이나 문서 갱신 전 공식 문서를 다시 확인합니다.

## 프롬프트 조합 순서

앱 내부 프롬프트는 아래 순서를 따릅니다.

1. 생성 의도: “이 컷의 이미지 레이어를 생성한다.”
2. 텍스트 금지 규칙: 자막, 대사, 말풍선, 로고, 워터마크, UI 텍스트 금지
3. 프로젝트 맥락: 콘텐츠 유형, 캔버스 비율, 컷 순서
4. 캐릭터 참조: 이름, Markdown 설명, 표정 이미지 이름
5. 배경 참조: 배경 이름, 배경 프롬프트, 기본 색상
6. 컷 맥락: 컷 시나리오, 자막, 대사를 “맥락 전용”으로 전달
7. 시각 지시: 사용자가 입력한 이미지 프롬프트
8. 품질 가드레일: 손 왜곡, 여분의 팔다리, 흐림, 저품질, 텍스트 아티팩트 방지
9. 합성 요구사항: HTML/CSS 텍스트가 올라갈 수 있도록 여백 확보

이 순서는 모델이 먼저 “무엇을 만들지”를 이해하고, 그 다음 “무엇을 만들면 안 되는지”를 안정적으로 지키게 하기 위한 구조입니다.

## 권장 프롬프트 템플릿

사용자가 입력하는 `이미지 프롬프트`는 아래 요소를 한 문단 또는 짧은 항목으로 표현하는 것이 좋습니다.

```text
[주체]가 [행동/감정]을 보이는 장면.
장소는 [배경/환경]이고, [구도/거리/시점]으로 보인다.
[조명/색감/분위기]를 사용한다.
[일러스트/웹툰/카드뉴스/사진풍] 스타일이며, [추가 디테일]을 포함한다.
텍스트, 말풍선, 자막, 로고, UI는 이미지 안에 넣지 않는다.
```

영문 제어 문장이 더 안정적인 경우에는 아래처럼 작성할 수 있습니다.

```text
Medium shot of the selected character looking surprised while holding a tablet in a clean local studio room.
Use soft daylight, calm editorial webtoon style, simple background depth, and clear facial expression.
Leave clean negative space for later HTML caption and dialogue overlays.
No readable text, captions, speech bubbles, signs, logos, UI, or subtitles inside the image.
```

## 좋은 입력과 나쁜 입력

나쁜 입력:

```text
번아웃 카드뉴스 이미지 만들어줘
```

문제점:

- 주체가 불명확합니다.
- 장소와 구도가 없습니다.
- 어떤 감정과 행동을 보여줄지 알 수 없습니다.
- 텍스트 금지 조건이 없습니다.

좋은 입력:

```text
피곤한 직장인이 늦은 밤 책상 앞에서 노트북을 바라보는 장면.
책상에는 커피컵과 메모지가 있고, 방은 조용한 사무실 분위기다.
인물은 화면 중앙보다 약간 오른쪽에 배치하고, 왼쪽에는 자막이 올라갈 여백을 둔다.
부드러운 파란빛 조명, 절제된 카드뉴스 일러스트 스타일.
이미지 안에는 글자, 말풍선, 자막, 로고를 넣지 않는다.
```

## 캐릭터 일관성 규칙

- 캐릭터 설명 Markdown에는 외형, 체형, 얼굴 특징, 의상, 성격, 자주 쓰는 표정, 피해야 할 표현을 구체적으로 적습니다.
- 표정 이미지는 “복사할 이미지”가 아니라 캐릭터의 얼굴, 분위기, 표정을 맞추기 위한 참조입니다.
- 한 번의 요청에 너무 많은 표정 이미지를 넣지 않습니다. 현재 앱은 선택 캐릭터의 표정 이미지를 최대 3개까지 생성 요청에 포함합니다.
- 컷 프롬프트가 캐릭터 설명과 충돌하면 캐릭터 설명을 우선하고, 컷 프롬프트는 장면/행동/구도에 집중합니다.

캐릭터 설명 Markdown 권장 구조:

```markdown
# 캐릭터 이름

## 외형
- 얼굴형:
- 머리:
- 눈:
- 의상:
- 대표 색상:

## 성격과 표현
- 기본 성격:
- 자주 쓰는 표정:
- 피해야 할 표정:

## 그림체 기준
- 선:
- 채색:
- 비율:
- 금지:
```

## 배경 규칙

- 배경 프롬프트는 “항상 유지할 기본 세계관”으로 작성합니다.
- 컷별 이미지 프롬프트는 배경을 완전히 대체하기보다, 해당 컷에서 필요한 소품, 시간대, 인물 위치, 카메라 거리만 추가하는 것이 안정적입니다.
- 배경 색상은 fallback과 톤 기준으로 사용합니다. 이미지에 특정 색상만 강제하는 지시로 해석하지 않습니다.
- 배경 프롬프트에는 읽을 수 있는 간판, 포스터, 화면 속 문자를 요구하지 않습니다.

## 자막과 대사 처리

자막과 대사는 이미지 생성 모델에 다음 방식으로 전달합니다.

- `caption`: 장면의 주제와 감정선을 이해하기 위한 맥락
- `dialogue`: 인물의 행동, 표정, 상황을 이해하기 위한 맥락
- HTML/CSS 레이어: 실제 사용자가 보게 되는 최종 텍스트

이미지 모델이 텍스트를 그리도록 유도하면 사용자가 컷을 수정하기 어려워지고, 한국어 글자 품질도 흔들릴 수 있습니다. 따라서 텍스트는 항상 앱 레이어에서 렌더링합니다.

## 캔버스와 구도

- `1:1`: 중앙 주체와 균형 잡힌 여백이 중요합니다.
- `4:5`: 피드형 카드뉴스에 적합합니다. 상단 또는 하단에 텍스트 레이어가 올라갈 수 있는 여백을 확보합니다.
- `9:16`: 세로 스토리형 화면입니다. 인물을 너무 크게 채우면 텍스트와 겹치기 쉬우므로 상단/하단 안전 영역을 남깁니다.

프롬프트에는 필요한 경우 다음 표현을 추가합니다.

```text
Leave comfortable clean space for later caption and dialogue overlays.
Keep the main subject away from the top and bottom safe areas.
Avoid important details near the edges.
```

## 부정 조건 작성법

이미지 프롬프트 가이드들은 공통적으로 “하지 말 것”만 길게 나열하기보다 원하는 장면을 명확히 설명하는 방식을 권장합니다. 따라서 앱 공통 금지 문구는 유지하되, 컷 프롬프트에서는 가능하면 원하는 상태를 구체적으로 씁니다.

권장:

```text
an empty quiet street with no traffic, clean storefronts without readable signs
```

비권장:

```text
no cars, no people, no sign, no poster, no text, no clutter, no mess
```

단, 텍스트 금지는 제품 핵심 제약이므로 예외적으로 반복해서 명시합니다.

## 실패 시 개선 순서

이미지가 기대와 다르면 한 번에 모든 조건을 바꾸지 말고 하나씩 수정합니다.

1. 주체가 틀렸다면 캐릭터 설명과 컷 프롬프트의 주체 문장을 먼저 고칩니다.
2. 배경이 틀렸다면 Assets의 배경 프롬프트를 더 구체화합니다.
3. 구도가 틀렸다면 `wide shot`, `medium shot`, `close-up`, `low angle`, `top-down view` 같은 구도 표현을 추가합니다.
4. 감정이 약하면 표정, 몸짓, 손동작을 구체적으로 씁니다.
5. 텍스트가 이미지 안에 생기면 금지 문구를 유지하고, “blank signs”, “clean surfaces”, “no readable markings”처럼 긍정형 제약을 추가합니다.
6. 손이나 팔다리가 깨지면 소품을 단순화하고, 손이 화면 밖에 있거나 자연스럽게 가려지는 구도를 사용합니다.

## 앱 구현 체크리스트

- Gemini API Key는 localStorage에서 읽고 요청 중에만 사용합니다.
- 요청 로그와 오류 메시지에 API Key가 포함되지 않게 합니다.
- `imageDataUrl`은 기존 컷 PATCH 흐름으로 저장합니다.
- 생성 결과는 `imageStatus: "generated"`로 기록합니다.
- 실패 시 `quota`, `invalid key`, `network`, `no image`를 구분해 사용자에게 보여줍니다.
- 생성 이미지에는 SynthID 워터마크가 포함될 수 있음을 사용자 안내 또는 문서에서 유지합니다.
- 현재 route는 별도 `negativePrompt` 필드를 받지 않습니다. 부정 조건은 앱 공통 금지 문구와 사용자 `imagePrompt` 안의 보조 문장으로 처리합니다.

## 참고한 기준

- Google AI Developers, Gemini API 이미지 생성 문서: https://ai.google.dev/gemini-api/docs/image-generation
- Google AI Developers, Imagen 프롬프트 가이드: https://ai.google.dev/gemini-api/docs/imagen#imagen-prompt-guide
- Google The Keyword, Gemini 이미지 생성 프롬프트 팁: https://blog.google/products-and-platforms/products/gemini/image-generation-prompting-tips/
- OpenAI Academy, 이미지 생성 프롬프트 작성 가이드: https://openai.com/academy/image-generation/
- Midjourney 공식 Prompt Basics: https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
- Midjourney 공식 Image Prompts: https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
- Adobe Firefly 이미지 프롬프트 예시와 템플릿: https://www.adobe.com/products/firefly/ai-generated-examples/image-prompts.html
