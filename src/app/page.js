"use client"
import React, { createContext } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'

function Home() {
  return (
    <div className="flex flex-col">
        <Header />
        <Hero />
        <Footer />
    </div>
  )
}
export default Home;