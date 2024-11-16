# Setup 
run `npm i kritzel-angular`

Add LibModule to the providers array in you appConfig.
```
import  { LibModule } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
     importProvidersFrom(LibModule.forRoot())
  ]
};
```

Include the LibModule into the imports array of your component to use Kritzel components in you template.

```
import { LibModule } from 'kritzel-angular';

@Component({
  selector: 'my-component',
  standalone: true,
  imports: [LibModule],
  template: `
    <my-list></my-list>
  `,
})
export class MyComponent {
}
```