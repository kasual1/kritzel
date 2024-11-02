import { Component, Prop, h } from '@stencil/core';
import { format } from '../../utils/utils';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The last name
   */
  @Prop() last: string;

  /**
   * Age
   */
  @Prop() age: number;


  private getText(): string {
    return format(this.first, this.last);
  }


  render() {
    return <div>Guten Tag! I'm {this.getText()} and I'm {this.age} years old.</div>;
  }
}
