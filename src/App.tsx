// import { useState } from 'react'

import { Routes, Route } from 'react-router-dom';



import './App.css'

import ChatApp from './Pages/Chat'
import SignInUp from './Pages/SignInUp'
import UserInfo from './Pages/UserInfo';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SignInUp />} />
        <Route path = "/user-info" element = {<UserInfo/>}/>
        <Route path="/home" element={<ChatApp />} />
      </Routes>
      {/* <SignInUp/>
      <ChatApp/> */}
    </>
  )
}

export default App
