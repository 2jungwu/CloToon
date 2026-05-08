# Image Generation Rules

This app generates only the visual image layer for each cut. Final Korean caption and dialogue text must stay in the existing HTML/CSS cut preview layer.

## Inputs

- Project: content type and canvas preset.
- Assets: selected character name, character markdown, character expression images, and default background prompt.
- Cut: cut scenario, caption, dialogue, image prompt, and negative prompt.

## Prompt Rules

- Use `gemini-3.1-flash-image-preview` as the default Gemini image model.
- Request an image response from Gemini and include the project canvas preset in the prompt.
- Use the selected character markdown as the primary consistency reference.
- Use character expression images only as visual references for expression and identity.
- Use the default background prompt unless the cut image prompt clearly overrides it.
- Treat caption and dialogue as scene context only.
- Do not render readable text inside generated images.

Required ban in every prompt:

```text
No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue inside the generated image.
```

## Storage And Privacy

- Gemini API keys are not committed to source control and are not stored in the SQLite project database.
- The browser reads the key from `local-studio-settings.geminiApiKey` and sends it only to the local Next API route for the current request.
- Runtime prompt assembly does not create intermediate markdown files.
- Generated images are saved back to the selected cut as `imageDataUrl` with `imageStatus: "generated"`.

## Failure Handling

- Missing API key should be handled in the workspace UI before calling Gemini.
- Quota errors should tell the user to check Google AI Studio billing/quota.
- API key errors should tell the user to verify the key.
- Existing mock image and upload flows remain available as local fallbacks.
