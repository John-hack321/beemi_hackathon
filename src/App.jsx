import { useState, useEffect } from 'react'
import './App.css'
import BeemiProvider from './components/BeemiProvider'
import CommentList from './components/CommentList'

function App() {
  const [comments, setComments] = useState([])

  return (
    <BeemiProvider>
      <div className="app">
        <div className="header">
          <h1>hack_enterance</h1>
        </div>
        
        <div className="content">
          <CommentList comments={comments} setComments={setComments} />
        </div>
      </div>
    </BeemiProvider>
  )
}

export default App 