# Navigation Drawer with Scroll Position Preservation

This implementation demonstrates how to solve the issue of scroll position jumping back to the top when clicking on settings items within a navigation drawer component.

## Problem Statement

When users click on a settings item from the settings page inside a drawer component scrollview, the scrollview's scroll position automatically jumps back to the top. This creates a poor user experience as users lose their place in the list after navigation.

## Solution

The solution involves implementing scroll position state management within the drawer component:

### Key Features

1. **Scroll Position Tracking**: The component maintains the current scroll position in component state
2. **Position Saving**: Before navigation, the current scroll position is saved
3. **Position Restoration**: After navigation or when the drawer reopens, the scroll position is restored
4. **Smooth Scrolling**: Uses `requestAnimationFrame` to ensure proper DOM updates before restoring position

### Implementation Details

#### Scroll Position State Management
```typescript
@State()
private scrollPosition: number = 0;

private scrollContainer!: HTMLElement;
```

#### Saving Scroll Position
```typescript
private saveScrollPosition() {
  if (this.scrollContainer) {
    this.scrollPosition = this.scrollContainer.scrollTop;
  }
}
```

#### Restoring Scroll Position
```typescript
private restoreScrollPosition() {
  if (this.scrollContainer && this.scrollPosition > 0) {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      this.scrollContainer.scrollTop = this.scrollPosition;
    });
  }
}
```

#### Event Handling
```typescript
private handleItemClick(item: NavigationItem, event: Event) {
  // Save current scroll position before navigation
  this.saveScrollPosition();
  
  // Prevent default behavior that might cause scroll reset
  event.preventDefault();
  event.stopPropagation();
  
  // Execute custom action and emit event
  if (item.action) {
    item.action();
  }
  
  this.itemSelected.emit(item);
}
```

### CSS Considerations

The drawer scroll container includes specific CSS to prevent layout shifts and ensure smooth scrolling:

```css
.drawer-scroll-container {
  flex: 1;
  overflow-y: auto;
  /* Ensure smooth scrolling */
  scroll-behavior: smooth;
  /* Prevent scroll bar from causing layout shifts */
  scrollbar-gutter: stable;
}

.drawer-item-button {
  /* Prevent button focus from causing scroll jumps */
  outline: none;
}

.drawer-item-button:focus {
  /* Use a subtle box shadow instead of outline to prevent layout shifts */
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
}
```

## Usage

The navigation drawer component can be used as follows:

```typescript
<kritzel-navigation-drawer
  items={settingsItems}
  isOpen={isDrawerOpen}
  drawerTitle="Settings"
  onItemSelected={(event) => handleItemSelected(event)}
  onDrawerClosed={() => handleCloseDrawer()}
></kritzel-navigation-drawer>
```

## Benefits

1. **Improved UX**: Users maintain their scroll position when navigating between settings
2. **Reduced Frustration**: No need to scroll back to find previously viewed items
3. **Better Navigation Flow**: Seamless experience when moving between different settings pages
4. **Accessibility**: Focus management and keyboard navigation support

## Browser Compatibility

This solution works in all modern browsers and includes fallbacks for older browsers. The scroll position preservation uses standard DOM APIs that are widely supported.