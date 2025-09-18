import { Component, Host, h, State } from '@stencil/core';
import { NavigationItem } from '../kritzel-navigation-drawer/kritzel-navigation-drawer';

@Component({
  tag: 'kritzel-drawer-demo',
  styleUrl: 'kritzel-drawer-demo.css',
  shadow: true,
})
export class KritzelDrawerDemo {
  @State()
  isDrawerOpen: boolean = false;

  @State()
  selectedItemInfo: string = '';

  private generateSettingsItems(): NavigationItem[] {
    const settingsItems: NavigationItem[] = [];
    
    // Create many items to demonstrate scrolling
    for (let i = 1; i <= 30; i++) {
      settingsItems.push({
        id: `setting-${i}`,
        label: `Settings Item ${i}`,
        icon: '⚙️',
        action: () => {
          console.log(`Settings Item ${i} clicked`);
          this.selectedItemInfo = `Last selected: Settings Item ${i}`;
          // Simulate navigation - normally this would navigate to another page
          setTimeout(() => {
            // Close and reopen drawer to simulate coming back from a settings page
            this.isDrawerOpen = false;
            setTimeout(() => {
              this.isDrawerOpen = true;
            }, 500);
          }, 1000);
        }
      });
    }

    return settingsItems;
  }

  private handleOpenDrawer() {
    this.isDrawerOpen = true;
  }

  private handleCloseDrawer() {
    this.isDrawerOpen = false;
  }

  private handleItemSelected(event: CustomEvent<NavigationItem>) {
    const item = event.detail;
    console.log('Navigation item selected:', item);
  }

  render() {
    return (
      <Host>
        <div class="demo-container">
          <div class="demo-header">
            <h1>Navigation Drawer with Scroll Position Preservation</h1>
            <p>This demo shows how to maintain scroll position when navigating between settings items.</p>
          </div>

          <div class="demo-content">
            <button class="open-drawer-btn" onClick={() => this.handleOpenDrawer()}>
              Open Settings Drawer
            </button>

            {this.selectedItemInfo && (
              <div class="selection-info">
                <p>{this.selectedItemInfo}</p>
                <p><small>Try scrolling down in the drawer, clicking an item, and notice how the scroll position is preserved when you return!</small></p>
              </div>
            )}

            <div class="demo-instructions">
              <h3>How to test scroll position preservation:</h3>
              <ol>
                <li>Click "Open Settings Drawer" above</li>
                <li>Scroll down to see more settings items</li>
                <li>Click on any settings item (this simulates navigation)</li>
                <li>The drawer will close and reopen automatically to simulate returning from a settings page</li>
                <li>Notice that the scroll position is preserved!</li>
              </ol>
            </div>
          </div>

          <kritzel-navigation-drawer
            items={this.generateSettingsItems()}
            isOpen={this.isDrawerOpen}
            drawerTitle="Settings"
            onItemSelected={(event) => this.handleItemSelected(event)}
            onDrawerClosed={() => this.handleCloseDrawer()}
          ></kritzel-navigation-drawer>
        </div>
      </Host>
    );
  }
}