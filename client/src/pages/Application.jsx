import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";

import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import moment from "moment";
import Fouter from "../components/Fouter";
import { AppContext } from "../context/AppContext";

import { toast } from "react-toastify";

const Application = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);

  const {
    backendUrl,
    userData,
    userApplications,
    fetchUserApplications,
    fetchUserData,
  } = useContext(AppContext);

  // 👇 Log initial pour déboguer le chargement de la page
  useEffect(() => {
    console.log("📍 useEffect déclenché");
    console.log("👤 Utilisateur chargé :", user);
    console.log("📄 Données utilisateur (userData) :", userData);

    if (user) {
      console.log("📡 Appel à fetchUserApplications...");
      fetchUserApplications().then(() =>
        console.log("✅ fetchUserApplications terminé :", userApplications)
      );
    }
  }, [user]);

  if (!isLoaded) {
    console.log("⏳ Clerk n'a pas encore fini de charger");
    return <div>Chargement...</div>;
  }

  if (!user) {
    console.error("❌ Utilisateur non connecté !");
    return <div>Utilisateur non trouvé.</div>;
  }

  const updateResume = async () => {
    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();
      console.log("📥 Token obtenu :", token);
      console.log("📤 Envoi du CV au backend...");

      const { data } = await axios.post(
        backendUrl + "/api/user/update-resume",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("📨 Réponse du backend :", data);

      if (data.success) {
        toast.success(data.message);
        console.log("📄 Mise à jour des données utilisateur");
        await fetchUserData();
        console.log("🔁 Rechargement des candidatures");
        await fetchUserApplications();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      console.error("❌ Erreur lors de la mise à jour du CV :", error);
    }

    setIsEdit(false);
    setResume(null);
  };

  return (
    <>
      <Navbar />
      <div className="container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-10">
        <h2 className="text-xl font-semibold">Your Resume</h2>
        <div className="flex gap-2 mb-6 mt-3">
          {isEdit || (userData && userData.resume === "") ? (
            <>
              <label className="flex items-center" htmlFor="resumeUpload">
                <p className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg mr-2">
                  {resume ? resume.name : "Select Resume"}
                </p>
                <input
                  id="resumeUpload"
                  onChange={(e) => {
                    console.log("📎 Fichier sélectionné :", e.target.files[0]);
                    setResume(e.target.files[0]);
                  }}
                  accept="application/pdf"
                  type="file"
                  hidden
                />
                <img src={assets.profile_upload_icon} alt="" />
              </label>
              <button
                onClick={updateResume}
                className="bg-green-100 border border-green-400 rounded-lg px-4 py-2"
              >
                Save
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <a
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg"
                href={userData?.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                Resume
              </a>
              <button
                onClick={() => {
                  console.log("✏️ Passage en mode édition du CV");
                  setIsEdit(true);
                }}
                className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-4">Jobs Applied</h2>
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b text-left">Company</th>
              <th className="py-3 px-4 border-b text-left">Job Title</th>
              <th className="py-3 px-4 border-b text-left max-sm:hidden">
                Location
              </th>
              <th className="py-3 px-4 border-b text-left max-sm:hidden">
                Date
              </th>
              <th className="py-3 px-4 border-b text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {userApplications.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-400">
                  ⚠️ Aucune candidature trouvée.
                </td>
              </tr>
            ) : (
              userApplications.map((job, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 flex items-center gap-2 border-b">
                    <img
                      className="w-8 h-8"
                      src={job?.company_id?.image || ""}
                      alt=""
                    />
                    {job?.company_id?.name}
                  </td>
                  <td className="py-2 px-4 border-b">{job?.job_id?.title}</td>
                  <td className="py-2 px-4 border-b max-sm:hidden">
                    {job?.job_id?.location}
                  </td>
                  <td className="py-2 px-4 border-b max-sm:hidden">
                    {moment(job.date).format("ll")}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`${
                        job.status === "Accepted"
                          ? "bg-green-100"
                          : job.status === "Rejected"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      } px-4 py-1.5 rounded`}
                    >
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Fouter />
    </>
  );
};

export default Application;
