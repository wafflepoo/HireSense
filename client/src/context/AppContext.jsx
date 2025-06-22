import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { user } = useUser();
  const { getToken } = useAuth();

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });

  const [isSearched, setIsSearched] = useState(false);

  const [jobs, setJobs] = useState([]);

  const [franceTravailJobs, setFranceTravailJobs] = useState([]);

  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

  const [companyToken, setCompanyToken] = useState(null);

  const [companyData, setCompanyData] = useState(null);

  const [userData, setUserData] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Fonction pour récupérer les jobs classiques
  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/jobs");
      if (data.success) {
        setJobs(data.jobs);
        console.log("Jobs classiques:", data.jobs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fonction pour récupérer les données de la société
  const fetchCompanyData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/company/company", {
        headers: { token: companyToken },
      });
      if (data.success) {
        setCompanyData(data.company);
        console.log("Company data:", data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //Function to fetch user data

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      console.log("Token JWT obtenu:", token);

      const { data } = await axios.get(backendUrl + "/api/user/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Réponse de /api/user/user:", data);

      if (data.success && data.user) {
        setUserData(data.user);
        if (data.user.role === "admin") {
          setIsAdmin(true);
        }
        console.log("Données utilisateur mises à jour:", data.user);
      } else {
        console.log("user not found or not admin");
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Erreur fetchUserData:", error.message);
      toast.error(error.message);
    }
  };

  //Function to fetch user's applied applications data
  // Function to fetch user's applied applications data
  const fetchUserApplications = async () => {
    try {
      const token = await getToken();
      console.log("🔑 Token envoyé pour /api/user/application :", token);

      const { data } = await axios.get(backendUrl + "/api/user/application", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📨 Réponse reçue de /api/user/application :", data);

      if (data.success) {
        console.log("✅ Applications récupérées :", data.applications);
        setUserApplications(data.applications);
      } else {
        console.error("❌ Échec récupération des applications :", data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error(
        "❌ Erreur dans fetchUserApplications :",
        error.response?.data || error.message
      );
      toast.error(error.message);
    }
  };

  // Au montage, on charge les jobs et les jobs France Travail + token en local storage
  useEffect(() => {
    fetchJobs();

    const storedCompanyToken = localStorage.getItem("companyToken");
    if (storedCompanyToken) {
      setCompanyToken(storedCompanyToken);
    }
  }, []);

  // Quand on a un token, on charge les données de la société
  useEffect(() => {
    if (companyToken) {
      fetchCompanyData();
    }
  }, [companyToken]);

  useEffect(() => {
    if (user) {
      console.log("Utilisateur Clerk détecté:", user);
      fetchUserData();
      fetchUserApplications();
    } else {
      console.log("Aucun utilisateur connecté.");
    }
  }, [user]);

  useEffect(() => {
    
    console.log({
      user,
      userData,
      companyToken,
      companyData,
      jobs,
      searchFilter,
      isSearched,
    });
  }, [
    user,
    userData,
    companyToken,
    companyData,
    jobs,
    searchFilter,
    isSearched,
  ]);

  const value = {
    setSearchFilter,
    searchFilter,
    isSearched,
    setIsSearched,
    jobs,
    setJobs,
    showRecruiterLogin,
    setShowRecruiterLogin,
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    backendUrl,
    userData,
    setUserData,
    userApplications,
    setUserApplications,
    fetchUserData,
    fetchUserApplications,
    isAdmin,
    setIsAdmin,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
