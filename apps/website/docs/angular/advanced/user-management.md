---
sidebar_label: User Management
displayed_sidebar: tutorialSidebar
title: "User Management Concept | Kritzel for Angular"
description: "Understand how to configure Kritzel's user management and login dialog with authentication providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# User Management

## Overview

Kritzel comes with a whole set of user management features, such as configurable login dialogs and user profile handling. While the editor provides the UI and event hooks, your application is responsible for performing the actual authentication and managing user state.

## Configuring Providers

To enable Kritzel's user management features, you need to provide a `loginConfig` with at least one authentication provider. This will render the login button at the top right of the editor and display the login dialog with a button of the corresponding provider.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/user-management/providers"
  repoFiles={['src/app/pages/advanced/user-management/user-management-providers.component.ts']}
/>

## Handling the Login

Clicking a provider button puts that button into a loading state and emits the editor's `LoginEvent`. Your application performs the sign-in and then sets the current user accordingly.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/user-management/login"
  repoFiles={['src/app/pages/advanced/user-management/user-management-login.component.ts']}
/>

## Handling the Logout

When the user selects the logout action, the editor emits the logout event. Your application then should clear the current user and update its authentication state.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/user-management/logout"
  repoFiles={['src/app/pages/advanced/user-management/user-management-logout.component.ts']}
/>

## Setting the User

Use `[user]` for the logged-in user and `[activeUsers]` for workspace collaborators. The current user drives the account UI and awareness metadata, while active users appear as avatars in the editor header; both bindings update at runtime, so clearing `[user]` signs out and replacing `[activeUsers]` refreshes the collaborator list.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/user-management/users"
  repoFiles={['src/app/pages/advanced/user-management/user-management-users.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [User Management](../api-reference/editor.md#user-management)