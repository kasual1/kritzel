'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import React from 'react';
import { MyButton as MyButtonElement, defineCustomElement as defineMyButton } from "../../../../stencil/dist/components/my-button.js";
import { MyComponent as MyComponentElement, defineCustomElement as defineMyComponent } from "../../../../stencil/dist/components/my-component.js";
import { MyList as MyListElement, defineCustomElement as defineMyList } from "../../../../stencil/dist/components/my-list.js";
import { MyTitle as MyTitleElement, defineCustomElement as defineMyTitle } from "../../../../stencil/dist/components/my-title.js";
export const MyButton = /*@__PURE__*/ createComponent({
    tagName: 'my-button',
    elementClass: MyButtonElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {},
    defineCustomElement: defineMyButton
});
export const MyComponent = /*@__PURE__*/ createComponent({
    tagName: 'my-component',
    elementClass: MyComponentElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {},
    defineCustomElement: defineMyComponent
});
export const MyList = /*@__PURE__*/ createComponent({
    tagName: 'my-list',
    elementClass: MyListElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {},
    defineCustomElement: defineMyList
});
export const MyTitle = /*@__PURE__*/ createComponent({
    tagName: 'my-title',
    elementClass: MyTitleElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {},
    defineCustomElement: defineMyTitle
});
