Post 2: “Generative UI on an Infinite Canvas”

Main keyword: generative UI (with variants like “LLM generated UI” and “generative UI React”)
Meta description idea: “Connect an LLM to an infinite canvas and turn prompts into working, sandboxed user interfaces with Kritzel.”
Publish: about 1–2 weeks after post 1

Intro. What generative UI is and why a canvas works better for it than a chat answer: several UIs side by side, and you can select one and iterate on it. Link to post 1 for the background.
Setting up the editor and chat box. isChatBoxVisible, onChatSubmit, onChatStop with an AbortController, isChatBoxLoading
Writing the system prompt. Ask for a full HTML document, fill the frame, keep it self-contained, follow the sandbox rules.
Putting the UI on the canvas. KritzelIframeObject, loadingContent as a placeholder, and updateObject() once the model answers
Editing an existing UI. Use getSelectedObjects() to choose between “change this” and “create new”, and send the current HTML back to the model.
Layout and viewport. Place new UIs next to the existing ones and call setViewport() so the new one is in view.
Security and production notes. Sandboxed iframes, keys on the backend, swapping out complete()
Live demo and wrap-up. Embedded demo, then link to post 3: “Next: show users what the agent is doing.”