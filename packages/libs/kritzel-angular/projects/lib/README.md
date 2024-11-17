# Setup 
Install the kritzel-angular package
```
npm i kritzel-angular
```

Add LibModule to the providers array in your app.config.ts
```typescript
import  { LibModule } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
     importProvidersFrom(LibModule.forRoot())
  ]
};
```

Include the LibModule into the imports array of your component to use Kritzel components in you template.

```typescript
import { LibModule } from 'kritzel-angular';

@Component({
  selector: 'my-component',
  standalone: true,
  imports: [LibModule],
  template: `
    <kritzel-engine></kritzel-engine>
    <kritzel-controls></kritzel-controls>
  `,
})
export class MyComponent {
}
```