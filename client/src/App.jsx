import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'; // chemin selon ton arborescence


import Home from './pages/home'
import ApplyJob from './pages/ApplyJob'
import Application from './pages/Application'
import RecruiterLogin from './components/RecruiterLogin';
import { AppContext } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import ManageJobs from './pages/ManageJobs';
import ViewApplications from './pages/ViewApplications';
import AddJob from './pages/AddJob';
import 'quill/dist/quill.snow.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const App = () => {



  const  {showRecruiterLogin , companyToken} = useContext(AppContext)
  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin/>}
      <ToastContainer />
      <Routes>
        
        <Route path='/' element = {<Home />} />
        <Route path='/apply-job/:id' element = {<ApplyJob />} />
        <Route path='/application' element = {<Application />} />
        <Route path='/dashboard' element={<Dashboard />}>
        {companyToken ? 
        <>
        <Route path='add-job' element={<AddJob />} />
  <Route path='manage-jobs' element={<ManageJobs />} />
  <Route path='view-applications' element={<ViewApplications />} />
        </> : null}
  
</Route>

      
      </Routes>
    </div>
  )
}
export default App