import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import JobListing from '../components/JobListing'
import Fouter from '../components/Fouter'
const Home = () => {
  return (
    <div>
        <Navbar />
        <Hero />
        <JobListing />
        <Fouter />
        
    </div>
  )
}

export default Home