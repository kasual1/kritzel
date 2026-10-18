---
sidebar_label: User Management
displayed_sidebar: tutorialSidebar
title: "User Management Concept | Kritzel for React"
description: "Understand how to configure Kritzel's user management and login dialog with authentication providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# User Management

## Overview

Kritzel comes with a whole set of user management features, such as configurable login dialogs and user profile handling. While the editor provides the UI and event hooks, your application is responsible for performing the actual authentication and managing user state.

## Configuring Providers

To enable Kritzel's user management features, provide a `loginConfig` with at least one authentication provider. This renders the login button at the top right of `<KritzelEditor>` and displays the login dialog with a button for each configured provider.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/user-management/providers"
  repoFiles={[
    'src/pages/advanced/user-management/UserManagementProvidersPage.tsx',
    'src/pages/advanced/user-management/user-management-shared.tsx',
  ]}
/>

## Handling the Login

Clicking a provider button puts that button into a loading state and invokes the editor's `onLogin` callback with a `LoginEvent`. Your application performs the sign-in and then sets the controlled `user` prop accordingly.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/user-management/login"
  repoFiles={[
    'src/pages/advanced/user-management/UserManagementLoginPage.tsx',
    'src/pages/advanced/user-management/user-management-shared.tsx',
  ]}
/>

## Handling the Logout

When the user selects the logout action, `<KritzelEditor>` invokes `onLogout`. Your application should clear the controlled `user` prop and update its authentication state.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/user-management/logout"
  repoFiles={[
    'src/pages/advanced/user-management/UserManagementLogoutPage.tsx',
    'src/pages/advanced/user-management/user-management-shared.tsx',
  ]}
/>

## Setting the User

Use the `user` prop for the logged-in user and `activeUsers` for workspace collaborators. The current user drives the account UI and awareness metadata, while active users appear as avatars in the editor header. Both props update at runtime, so clearing `user` signs out and replacing `activeUsers` refreshes the collaborator list.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/user-management/users"
  repoFiles={[
    'src/pages/advanced/user-management/UserManagementUsersPage.tsx',
    'src/pages/advanced/user-management/user-management-shared.tsx',
  ]}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [User Management](../api-reference/editor.md#user-management)
- [Collaboration](../api-reference/editor.md#collaboration)