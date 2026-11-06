import { Component, Host, h, Prop } from '@stencil/core';
import { IKritzelUser, KritzelAgentPresence, KritzelRemoteAgentPresence } from '@kritzel/core';

type StackEntry = { kind: 'user'; user: IKritzelUser } | { kind: 'agent'; agent: KritzelAgentPresence | KritzelRemoteAgentPresence };

@Component({
  tag: 'kritzel-active-users',
  styleUrl: 'kritzel-active-users.css',
  shadow: true,
})
export class KritzelActiveUsers {
  /**
   * Array of active users to display
   */
  @Prop() users: IKritzelUser[] = [];

  /**
   * Agents to display after the users: local agents and agents of collaborators. Shown with a bot badge,
   * a ring while they work and their status in the tooltip.
   */
  @Prop() agents: (KritzelAgentPresence | KritzelRemoteAgentPresence)[] = [];

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /**
   * Maximum number of avatars to show before overflow text
   */
  @Prop() maxVisible: number = 3;

  /**
   * Overlap offset in pixels (negative margin between avatars)
   */
  @Prop() overlap: number = 20;

  private getDisplayName(user: IKritzelUser): string {
    return (
      user.displayName ??
      ([user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      'User')
    );
  }

  private getEntries(): StackEntry[] {
    const users = this.users ?? [];
    const userIds = new Set(users.map(user => user.id));
    // A host may list agents as users itself; show each one once.
    const agents = (this.agents ?? []).filter(agent => !userIds.has(agent.id));
    return [
      ...users.map(user => ({ kind: 'user' as const, user })),
      ...[...agents.filter(agent => !agent.isRemote), ...agents.filter(agent => agent.isRemote)].map(agent => ({ kind: 'agent' as const, agent })),
    ];
  }

  private entryKey(entry: StackEntry): string {
    if (entry.kind === 'user') {
      return `user-${entry.user.id}`;
    }
    return entry.agent.isRemote ? `agent-remote-${entry.agent.clientId}-${entry.agent.id}` : `agent-local-${entry.agent.id}`;
  }

  private renderTooltip(entry: StackEntry) {
    if (entry.kind === 'user') {
      return <span class="avatar-tooltip">{this.getDisplayName(entry.user)}</span>;
    }
    const { agent } = entry;
    const host = agent.isRemote ? agent.hostUser?.displayName : undefined;
    return (
      <span class="avatar-tooltip agent-tooltip">
        <span class="agent-tooltip-name">{agent.name}</span>
        {agent.status && <span class="agent-tooltip-status">{agent.status}</span>}
        {agent.isRemote && host && <span class="agent-tooltip-host">via {host}</span>}
      </span>
    );
  }

  render() {
    const entries = this.getEntries();
    if (entries.length === 0) {
      return <Host style={{ display: 'none' }}></Host>;
    }

    const visibleEntries = entries.slice(0, this.maxVisible);
    const hidden = entries.slice(this.maxVisible);

    return (
      <Host style={{ '--avatar-overlap': `-${this.overlap}px` }}>
        <div class="avatars">
          {visibleEntries.map((entry, index) => {
            const isAgent = entry.kind === 'agent';
            const isBusy = isAgent && (entry.agent.activeAction !== null || entry.agent.queueLength > 0);
            return (
              <div
                key={this.entryKey(entry)}
                class={{ 'avatar-wrapper': true, 'is-agent': isAgent, 'is-busy': isBusy, 'is-remote': isAgent && entry.agent.isRemote }}
                data-agent-id={isAgent ? entry.agent.id : undefined}
                style={{
                  marginLeft: index > 0 ? `var(--avatar-overlap)` : '0px',
                  zIndex: `${visibleEntries.length - index}`,
                  ...(isAgent ? { '--agent-color': entry.agent.color } : {}),
                }}
              >
                <kritzel-avatar user={entry.kind === 'user' ? entry.user : entry.agent} size={this.avatarSize}></kritzel-avatar>
                {isAgent && (
                  <span class="agent-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5c0 .55-.3 1.03-.75 1.29V6h3.75A3.5 3.5 0 0 1 20 9.5V16a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16V9.5A3.5 3.5 0 0 1 7.5 6h3.75V4.79A1.5 1.5 0 0 1 12 2zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM1 11h1.5v4H1v-4zm20.5 0H23v4h-1.5v-4z" />
                    </svg>
                  </span>
                )}
                {this.renderTooltip(entry)}
              </div>
            );
          })}
        </div>
        {hidden.length > 0 && (
          <span class="overflow-count">
            +{hidden.length}
            <span class="avatar-tooltip">
              {hidden.map(entry => (
                <div key={this.entryKey(entry)}>{entry.kind === 'user' ? this.getDisplayName(entry.user) : `${entry.agent.name} (agent)`}</div>
              ))}
            </span>
          </span>
        )}
      </Host>
    );
  }
}
