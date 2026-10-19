---
sidebar_label: User Management
displayed_sidebar: tutorialSidebar
title: "User Management Concept | Kritzel for Vue"
description: "Understand how to configure Kritzel's user management and login dialog with authentication providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# User Management

## Overview

Kritzel comes with a whole set of user management features, such as configurable login dialogs and user profile handling. While the editor provides the UI and event hooks, your application is responsible for performing the actual authentication and managing user state.

## Configuring Providers

To enable Kritzel's user management features, provide a `loginConfig` with at least one authentication provider. This renders the login button at the top right of `<KritzelEditor>` and displays the login dialog with a button for each provider.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/user-management/providers"
  repoFiles={['src/pages/advanced/user-management/UserManagementProvidersPage.vue']}
/>

## Handling the Login

Clicking a provider button puts that button into a loading state and emits the editor's `login` event. Your application performs the sign-in and then sets the current user accordingly.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/user-management/login"
  repoFiles={['src/pages/advanced/user-management/UserManagementLoginPage.vue']}
/>

## Handling the Logout

When the user selects the logout action, the editor emits the `logout` event. Your application should clear the current user and update its authentication state.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/user-management/logout"
  repoFiles={['src/pages/advanced/user-management/UserManagementLogoutPage.vue']}
/>

## Setting the User

Use `:user` for the logged-in user and `:activeUsers` for workspace collaborators. The current user drives the account UI and awareness metadata, while active users appear as avatars in the editor header; both props update at runtime, so clearing `user` signs out and replacing `activeUsers` refreshes the collaborator list.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/user-management/users"
  repoFiles={['src/pages/advanced/user-management/UserManagementUsersPage.vue']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [User Management](../api-reference/editor.md#user-management)