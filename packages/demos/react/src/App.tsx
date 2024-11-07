import './App.css'
import { MyComponent, MyList } from '@kritzel/react'

function App() {

  return (
    <>
      <MyComponent first="Lukas" last="Mühlenbeck" age="31"/>

      <MyList items={['item1', 'item2', 'item3', 'item4', 'item5']}/>
    </>
  )
}

export default App
