# Setup

Install the kritzel-react package.
```
npm i kritzel-react
```

Import Kritzel components to use them in your template.
```jsx
import { KritzelEngine, KritzelControls } from 'kritzel-react'

function MyComponent() {

  return (
    <>
      <KritzelEngine></KritzelEngine>
      <KritzelControls></KritzelControls>
    </>
  )
}

export default MyComponent
```
