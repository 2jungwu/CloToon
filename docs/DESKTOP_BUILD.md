# Windows EXE 빌드 가이드

## 개요

CloToon은 개발 중에는 Next.js 로컬 서버로 실행되지만, 배포용 Windows 앱은 Electron으로 패키징한다.
EXE를 실행하면 Electron main process가 `127.0.0.1:41521`에서 Next standalone 서버를 띄우고, Electron 창이 그 주소를 연다.
Electron은 실행마다 임시 인증 토큰을 생성해 Chromium 세션 쿠키로 심고, 데스크톱 서버의 변경 API는 해당 쿠키가 있는 동일 origin 요청만 허용한다.
별도 `node.exe`는 포함하지 않고, 패키징된 Electron 실행 파일을 `ELECTRON_RUN_AS_NODE=1` 모드로 재사용해 standalone 서버를 실행한다.

## 저장 경로

- 프로젝트/컷/생성 이미지 DB: `%APPDATA%\CloToon\data\app.db`
- Electron Chromium 데이터와 `localStorage`: `%APPDATA%\CloToon\electron`
- API Key, Assets, Settings: Electron 앱의 `localStorage`
- PNG/ZIP 내보내기: 기존 브라우저 다운로드 흐름을 사용한다.

API Key는 코드, DB, 문서, 로그에 저장하지 않는다. 사용자가 이미지 생성을 실행할 때만 Gemini 요청 본문과 헤더에 포함된다.

## 빌드 명령

루트에서 실행한다.

```powershell
npm install
npm run desktop:prepare
npm run desktop:pack
npm run desktop:dist
```

`desktop:prepare`는 Windows x64 환경에서 실행한다. 별도 Node 런타임을 resources에 복사하지 않으므로 빌드에 사용한 `node.exe` 버전이 EXE 용량에 직접 포함되지 않는다.

- `desktop:prepare`: `apps/studio`를 standalone으로 빌드하고 Electron resources를 준비한다.
- `desktop:pack`: 설치 없이 실행 가능한 unpacked 앱을 만든다.
- `desktop:dist`: Windows x64 portable EXE를 만든다. electron-builder는 `maximum` 압축을 쓰고 Electron locale은 `ko`, `en-US`만 포함해 산출물 크기를 줄인다.

## 산출물

- Unpacked 앱: `apps/desktop/dist/win-unpacked`
- Portable EXE: `apps/desktop/dist/CloToon-0.1.0-win-x64.exe`

`apps/desktop/resources`와 `apps/desktop/dist`는 빌드 산출물이므로 git에 커밋하지 않는다.

## 검증

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run desktop:prepare
npm run desktop:pack
npm run desktop:dist
```

EXE 또는 `win-unpacked\CloToon.exe`를 실행한 뒤 다음을 확인한다.

- `/projects`, `/assets`, `/settings` 화면이 열린다.
- 프로젝트를 생성하고 앱을 재실행해도 데이터가 유지된다.
- API Key와 에셋 설정을 저장하고 앱을 재실행해도 유지된다.
- PNG/ZIP 내보내기가 파일을 만든다.
- 같은 EXE를 다시 실행하면 새 서버를 띄우지 않고 기존 창이 포커스된다.

## 주의사항

- `127.0.0.1:41521` 포트는 고정이다. 포트를 바꾸면 localStorage origin이 달라져 저장된 API Key와 Assets가 보이지 않을 수 있다.
- 포트가 다른 프로세스에 점유되어 있으면 앱은 안내 메시지를 표시하고 종료한다.
- DB는 설치 폴더나 resources 폴더가 아니라 `%APPDATA%\CloToon\data`에 둔다.
- API Key와 에셋은 Electron Chromium `localStorage`에 남고, 데스크톱 변경 API 보호 토큰은 실행할 때마다 새로 생성되어 파일에 저장되지 않는다.
- Next standalone 서버는 Electron 실행 파일의 Node 모드로 실행한다. 패키지 산출물에 `resources\node\win-x64\node.exe`가 생기면 불필요한 런타임 복사가 다시 들어간 것이므로 제거해야 한다.
- 코드 서명은 v1 범위가 아니다. 배포 시 Windows SmartScreen 경고가 나타날 수 있다.
