import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-list',
  styleUrl: 'my-list.css',
  shadow: true,
})
export class MyList {

  @Prop()
  items: string[] = []

  onAdd = () => {
    this.items = [...this.items, 'New Item'];
  }


  render() {
    return (
      <Host>
        <button onClick={this.onAdd}>+Add</button>

        <ul>
          {this.items?.map(item => (
            <li>{item}</li>
          ))}
        </ul>

      </Host>
    );
  }
}
