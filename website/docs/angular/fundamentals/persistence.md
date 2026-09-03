---
sidebar_label: Persistence
displayed_sidebar: tutorialSidebar
title: "Persistence Concept | Kritzel for Angular"
description: "Understand how to persist Kritzel canvas data across page reloads using IndexedDBSyncProvider."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Persistence

## Overview

By default, Kritzel uses an empty sync provider list (`providers: []`), so canvas state is reset on page reload. To persist data locally in the browser, configure `syncConfig` with `IndexedDBSyncProvider`.

IndexedDB persistence is ideal when you want users to keep their canvas state across reloads and browser restarts on the same device.

## Persisting Canvas State with IndexedDB

Configure `IndexedDBSyncProvider` in `syncConfig.providers` to make object state durable in the browser.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/local"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-local.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Collaboration](../api-reference/editor.md#collaboration)
