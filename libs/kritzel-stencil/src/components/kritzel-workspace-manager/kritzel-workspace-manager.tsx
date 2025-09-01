import { Component, h, Event, EventEmitter } from '@stencil/core';
import { SplitButtonOption } from '../../components';

@Component({
  tag: 'kritzel-workspace-manager',
  styleUrl: 'kritzel-workspace-manager.css',
  shadow: true,
})
export class KritzelWorkspaceManager {
  @Event()
  create: EventEmitter<void>;

  @Event()
  select: EventEmitter<SplitButtonOption>;

  render() {
    return (
      <kritzel-split-button
        buttonText="Workspace"
        buttonIcon="plus"
        onButtonClick={() => this.create.emit()}
        onOptionSelect={event => this.select.emit(event.detail)}
      ></kritzel-split-button>
    );
  }
}
