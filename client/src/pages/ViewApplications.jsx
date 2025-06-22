import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import { assets } from '../assets/assets';
// import { Link } from 'react-router-dom'; // ⬅️ si tu veux utiliser Link

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [applicants, setApplicants] = useState([]);

  const fetchCompanyJobApplications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: {
          token: companyToken,
        },
      });

      if (data.success) {
        setApplicants(data.applications.reverse());
      } else {
        toast.error(data.message || 'Erreur lors de la récupération des candidatures');
      }
    } catch (error) {
      toast.error(error.message || 'Erreur réseau');
    }
  };

  const changeJobApplicationStatus = async (id, status) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-status`,
        { id, status },
        { headers: { token: companyToken } }
      );

      if (data.success) {
        fetchCompanyJobApplications();
      } else {
        toast.error(data.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      toast.error(error.message || 'Erreur réseau');
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications();
    }
  }, [companyToken]);

  if (!applicants) {
    return <Loading />;
  }

  if (applicants.length === 0) {
    return <div className="text-center py-10 text-gray-500">Aucune candidature trouvée.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* ✅ Bouton vers la page de scoring */}
<div className="flex justify-end mb-4">
  <a
    href="http://localhost:5000/affichage.html"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
  >
    🔍 Voir le Scoring des CVs
  </a>
</div>


      <div className="w-full max-w-6xl bg-white border border-gray-200 shadow-sm rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">#</th>
              <th className="py-2 px-4 text-left">Nom du candidat</th>
              <th className="py-2 px-4 text-left max-sm:hidden">Poste</th>
              <th className="py-2 px-4 text-left max-sm:hidden">Lieu</th>
              <th className="py-2 px-4 text-left">CV</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {applicants
              .filter(item => item.job_id && item.user_id)
              .map((applicant, index) => (
                <tr key={index} className="text-gray-700">
                  <td className="py-2 px-4 text-center">{index + 1}</td>
                  <td className="py-2 px-4 flex items-center gap-3">
                    <img
                      className="w-10 h-10 rounded-full object-cover max-sm:hidden"
                      src={applicant.user_id.image}
                      alt={applicant.user_id.name}
                    />
                    <span>{applicant.user_id.name}</span>
                  </td>
                  <td className="py-2 px-4 max-sm:hidden">{applicant.job_id.title}</td>
                  <td className="py-2 px-4 max-sm:hidden">{applicant.job_id.location}</td>
                  <td className="py-2 px-4">
                    <a
                      href={applicant.user_id.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded inline-flex gap-2 items-center hover:underline"
                    >
                      CV <img src={assets.resume_download_icon} alt="Télécharger CV" />
                    </a>
                  </td>
                  <td className="py-2 px-4 relative">
                    {applicant.status === 'Accepted' ? (
                      <span className="text-green-600 font-medium">Accepté</span>
                    ) : applicant.status === 'Rejected' ? (
                      <span className="text-red-600 font-medium">Refusé</span>
                    ) : (
                      <div className="relative inline-block text-left group">
                        <button className="text-gray-500 action-button">⋮</button>
                        <div className="z-10 hidden absolute right-0 md:left-0 top-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow group-hover:block">
                          <button
                            onClick={() => changeJobApplicationStatus(applicant._id, 'Accepted')}
                            className="block w-full text-left px-4 py-2 text-green-500 hover:bg-gray-100"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => changeJobApplicationStatus(applicant._id, 'Rejected')}
                            className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewApplications;
