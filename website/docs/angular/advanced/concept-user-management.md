---
sidebar_label: User Management
displayed_sidebar: tutorialSidebar
title: "User Management Concept | Kritzel for Angular"
description: "Understand how to configure Kritzel's user management and login dialog with authentication providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# User Management

## Overview

Kritzel ships a presentational login dialog (`kritzel-login-dialog`) that is rendered by `<kritzel-editor>` as soon as a `[loginConfig]` is supplied. The dialog only displays provider buttons and emits events — the actual authentication is always performed by your application.

Providing a `loginConfig` has two effects: a **Sign in** button appears in the editor header while no authenticated user is set, and features that require an account (such as sharing a workspace) open the dialog instead of failing.

The configuration object has the following shape:

```ts
interface KritzelLoginConfig {
  providers: KritzelLoginProvider[];
  title?: string;
  subtitle?: string;
}

interface KritzelLoginProvider {
  name: string;   // machine identifier emitted in the login event
  label: string;  // button text
  icon?: string;  // icon name registered via customSvgIcons
}
```

## Configuring Providers

Every entry in `providers` becomes one button in the dialog, in declaration order. The `name` is the identifier your application receives when the button is clicked, while `label` controls the visible text. The optional `icon` references a name resolved through the shared `KritzelIconRegistry`, so provider marks are registered with the `[customSvgIcons]` binding just like any other custom icon.

`title` and `subtitle` override the localized defaults of the dialog header. When `title` is omitted, the active locale's `login.dialogTitle` term is used.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/user-management-providers"
  repoFiles={['src/app/advanced/user-management/user-management-providers.component.ts']}
/>

## Handling the Login Flow

Clicking a provider button puts that button into a loading state and emits the editor's `(login)` output with a `LoginEvent` containing the provider `name`. Your application performs the sign-in and then reports the result back to the editor:

- Call `setLoginLoading(provider)` while authentication is pending and `setLoginLoading(null)` when it settles.
- Set the `[user]` binding to an `IKritzelUser` once authentication succeeds. A user with `isGuest: false` replaces the Sign in button with the current-user avatar.
- Handle the `(logout)` output to clear the user again.
- Call `openLoginDialog()` to open the dialog from your own UI, for example from an application menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/user-management-flow"
  repoFiles={['src/app/advanced/user-management/user-management-flow.component.ts']}
/>

## Theming the Dialog

The dialog reads its colors from the `loginDialog` section of a `KritzelTheme`, which covers the subtitle color, the provider button background, border, hover and active states, and the spinner colors. Extend the shipped `lightTheme` or `darkTheme` sections to match your application's branding.

## Related API Methods and Types

- Configuration ([loginConfig](../api-reference-editor.md#props), `KritzelLoginConfig`, `KritzelLoginProvider`)
- Provider icons ([customSvgIcons](../api-reference-editor.md#props), `KritzelIconRegistry`)
- User state ([user](../api-reference-editor.md#props), `IKritzelUser`)
- Events ([login](../api-reference-editor.md#events), [logout](../api-reference-editor.md#events), `LoginEvent`)
- Methods ([openLoginDialog](../api-reference-editor.md#openlogindialog), [setLoginLoading](../api-reference-editor.md#setloginloading))

For a comprehensive view, see the [API Reference](../api-reference-editor.md).
