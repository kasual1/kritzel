---
title: "What Is an Agentic Canvas? And How to Build One"
description: "Agentic canvases let AI agents work alongside people on an infinite canvas. Learn what they are, who builds them, and how to create your own with Kritzel."
date: 2026-11-01
thumbnail: /videos/2026_11_04_Agentic_Canvas.mp4
thumbnailSeed: "e5315435"
image: /img/blog/what-is-an-agentic-canvas.png
---

Post 1 (overview): “What Is an Agentic Canvas? And How to Build One”

Main keyword: agentic canvas (concept and overview)
Meta description idea: “Agentic canvases let AI agents work alongside people on an infinite canvas. Learn what they are, who builds them, and how to create your own with Kritzel.”
Publish: first

From chat window to canvas.

Over the last couple of years the interaction with LLMs has undergone a paradigm shift from single chats to multi agent nonlinear workflows. While the chat window has proved to be the right tool for linear conversations AI companies more recently include spatial whiteboards specifically designed for visually related tasks such as brainstorming or prototyping.
Those canvases are the natural fit for parallel agentic work, as they allow multiple users, or in this case agents, to iterate over different parts of the same shared space. The canvas in this case becomes a room that allows humans and agents to interact with each other asynchronously, meaning that tasks can progress and finish at their own speed instead of being bound to a linear flow like in a conversation.


What makes a canvas “agentic”?

Very similar to how a regular infinite canvas provides humans with the tools to view and interact with the canvas, an agentic canvas provides that same capabilities, but to agents instead. Hence, on an agentic canvas the agent can perform all the same task a human would but in order for a human to better follow the agents work usually agents different states are visually highlighted.


Who’s already building them. 

As mentioned earlier, quite a lot of companies have already integrated agentic canvas experiences into their products. Some of the most prominent players certainly are Miro, Figma and Framer, but also Anthropic's Design tool relies on an infinite canvas with agentic capabilities.
Those companies either have extended their closed source, internally developed canvas solutions with agentic capabilities on their own or rely on external propiertary providers such as tldraw to bring in agentic behaviour.


What an agentic canvas is made of. 

An agentic canvas usually consists of a DOM based canvas at its core that renders objects as plain html elements. That DOM based nature gives it one of it's most powerful features, namely to add not only paths and shapes but rich html content such as forms, videos or even entire web apps.
Those canvases usually come with agentic utility components such as cursors, a chatbox and configurable object titlebars, that makes it easy to hook up an LLM and give it full control over the canvas space.
Often the API provided by such canvases is declaratively configurable and can easily be used to adjust the canvas state by simply manipulating JSON objects. This allows not only humans but also agents to easily interact with the canvas in a programmatic way.


Building one with Kritzel. 

In the following section we are going to use the Kritzel library to quickly setup an agentic canvas. This is intended to only give a rough overview and both parts of the setup are covered in more detail in separate blog posts.






One short paragraph per part with a small snippet. Generative UI and agentic cursors each end with “→ deep dive” links to posts 2 and 3.


Before you ship. Backend API keys, sandboxing, multiplayer sync, any model provider.
Bonus: let your coding agent help. npx skills add kasual1/kritzel, two or three sentences.
Wrap-up. Links to /agentic, the docs and GitHub, plus what’s coming next in the series.