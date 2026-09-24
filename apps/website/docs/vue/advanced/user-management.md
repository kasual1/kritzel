---
sidebar_label: User Management
displayed_sidebar: tutorialSidebar
title: "User Management Concept | Kritzel for Vue"
description: "Understand how to configure Kritzel's user management and login dialog with authentication providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# User Management

## Overview

Kritzel ships a presentational login dialog that `<KritzelEditor>` renders as soon as a `loginConfig` prop is supplied. The dialog only displays provider buttons and emits events - the actual authentication is always performed by your application.

Providing a `loginConfig` has two effects: a **Sign in** button appears in the editor header while no authenticated user is set, and features that require an account (such as sharing a workspace) open the dialog instead of failing.

## Configuring Providers

Every entry in `providers` becomes one button in the dialog, in declaration order. The `name` is the identifier your application receives when the button is clicked, while `label` controls the visible text. The optional `icon` references a name resolved through the shared `KritzelIconRegistry`, so provider marks are registered with the `customSvgIcons` prop just like any other custom icon.

`title` and `subtitle` override the localized defaults of the dialog header. When `title` is omitted, the active locale's `login.dialogTitle` term is used.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/advanced/user-management/providers"
  repoFiles={['src/pages/advanced/user-management/UserManagementProvidersPage.vue']}
/>

## Handling the Login Flow

Clicking a provider button puts that button into a loading state and emits the editor's `login` event with a `LoginEvent` containing the provider `name`. Your application performs the sign-in and then reports the result back to the editor:

- Call `setLoginLoading(provider)` while authentication is pending and `setLoginLoading(null)` when it settles.
- Bind the `user` prop to an `IKritzelUser` once authentication succeeds. A user with `isGuest: false` replaces the Sign in button with the current-user avatar.
- Handle the `logout` event to clear the user again.
- Call `openLoginDialog()` to open the dialog from your own UI, for example from an application menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/advanced/user-management/flow"
  repoFiles={['src/pages/advanced/user-management/UserManagementFlowPage.vue']}
/>

## Theming the Dialog

The dialog reads its colors from the `loginDialog` section of a `KritzelTheme`, which covers the subtitle color, the provider button background, border, hover and active states, and the spinner colors. Extend the shipped `lightTheme` or `darkTheme` sections to match your application's branding.

## Related API Methods and Types

- Configuration (`loginConfig`, `KritzelLoginConfig`, `KritzelLoginProvider`)
- Provider icons (`customSvgIcons`, `KritzelIconRegistry`)
- User state (`user`, `IKritzelUser`)
- Events (`login`, `logout`, `LoginEvent`)
- Methods (`openLoginDialog`, `setLoginLoading`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).