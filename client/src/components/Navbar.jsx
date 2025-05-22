import React, { useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useClerk, useUser, UserButton } from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {
  const { openSignIn } = useClerk()
  const { user, isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  const {setShowRecruiterLogin} = useContext(AppContext)

  useEffect(() => {
    console.log('Navbar mounted')
  }, [])



  return (
    <div className='shadow py-2'>
      <div className='container px-4 mx-auto flex justify-between items-center'>
        <img onClick={()=>navigate('/')} className='cursor-pointer' src={assets.logo} alt="logo" />

        {isLoaded && user && user.id ? (
          <div className='flex items-center gap-4'>
            <Link to='/application' className='text-blue-600'>Applied Jobs</Link>
            <p> | </p>
            <p className='max-sm:hidden'>Hi, {user.firstName + ' ' + user.lastName}</p>
            <UserButton afterSignOutUrl='/' />
          </div>
        ) : (
          <div className='flex gap-4 max-sm:text-xs'>
            <button onClick={e=> setShowRecruiterLogin(true)} className='text-gray-600'>Recruiter Login</button>
            <button
              onClick={() => {
                console.log('Login button clicked, opening sign in modal')
                openSignIn({ redirectUrl: '/' })
              }}
              className='bg-blue-600 text-white px-4 py-1.5 rounded-full'
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
