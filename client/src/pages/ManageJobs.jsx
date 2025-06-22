import React, { useContext, useEffect, useState } from 'react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ManageJobs = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])

  const { backendUrl, companyToken } = useContext(AppContext)

  const fetchCompanyJobs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/list-jobs`, {
        headers: { token: companyToken }
      })

      if (data.success) {
        // 🔍 log complet
        console.log("✔️ Jobs reçus :", data.jobsData)

        setJobs(data.jobsData.reverse())
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.error("❌ Erreur fetchCompanyJobs:", error)
    }
  }

  const changeJobVisibility = async (id) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-visibility`,
        { id },
        { headers: { token: companyToken } }
      )

      if (data.success) {
        toast.success(data.message)

        // Mettre à jour localement
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job._id === id ? { ...job, visible: !job.visible } : job
          )
        )
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.error("❌ Erreur changeJobVisibility:", error)
    }
  }

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobs()
    }
  }, [companyToken])

  return (
    <div className='container p-4 max-w-5xl'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 max-sm:text-sm'>
          <thead>
            <tr>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>#</th>
              <th className='py-2 px-4 border-b text-left'>Job Title</th>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>Date</th>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>Location</th>
              <th className='py-2 px-4 border-b text-center'>Applicants</th>
              <th className='py-2 px-4 border-b text-left'>Visible</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(jobs) && jobs.map((job, index) => {
              const applicantCount = Array.isArray(job.applicants)
                ? job.applicants.length
                : typeof job.applicants === 'number'
                ? job.applicants
                : 0

              console.log(`📝 Job "${job.title}" → applicants:`, job.applicants)

              return (
                <tr key={job._id} className='text-gray-700'>
                  <td className='py-2 px-4 border-b max-sm:hidden'>{index + 1}</td>
                  <td className='py-2 px-4 border-b'>{job.title}</td>
                  <td className='py-2 px-4 border-b max-sm:hidden'>{moment(job.date).format('ll')}</td>
                  <td className='py-2 px-4 border-b max-sm:hidden'>{job.location}</td>
                  <td className='py-2 px-4 border-b text-center'>{applicantCount}</td>
                  <td className='py-2 px-4 border-b'>
                    <input
                      type="checkbox"
                      className='scale-125 ml-4'
                      checked={job.visible}
                      onChange={() => changeJobVisibility(job._id)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className='mt-4 flex justify-end'>
        <button
          onClick={() => navigate('/dashboard/add-job')}
          className='bg-black text-white py-2 px-4 rounded'
        >
          Add new job
        </button>
      </div>
    </div>
  )
}

export default ManageJobs
