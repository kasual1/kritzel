---
sidebar_label: Persistence
displayed_sidebar: tutorialSidebar
title: "Persistence Concept | Kritzel for Vue"
description: "Understand how to persist Kritzel canvas data across page reloads using IndexedDBSyncProvider."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Persistence

## Overview

By default, Kritzel uses an empty provider list (`providers: []`), so canvas state resets on page reload. To persist data locally in the browser, configure `syncConfig` with `IndexedDBSyncProvider`.

IndexedDB persistence is ideal when you want users to keep their canvas state across reloads and browser restarts on the same device.

## Persisting Canvas State with IndexedDB

Configure `IndexedDBSyncProvider` in `syncConfig.providers` to make object state durable in the browser.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/persistence-local"
  repoFiles={['src/pages/fundamentals/persistence/persistence-local.vue']}
/>

## Related API Methods

- Sync configuration (`syncConfig`, `KritzelSyncConfig`)
- Local persistence provider (`IndexedDBSyncProvider`)
- Provider list (`syncConfig.providers`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).