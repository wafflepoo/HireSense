import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { JobCategories } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState(0);

  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const { backendUrl, companyToken } = useContext(AppContext);

  const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

  const [debouncedLocation, setDebouncedLocation] = useState(location);

  useEffect(() => {
    console.log("[useEffect] Location changed:", location);
    const handler = setTimeout(() => {
      console.log("[Debounce] Setting debounced location:", location);
      setDebouncedLocation(location);
    }, 300);

    return () => clearTimeout(handler);
  }, [location]);

  useEffect(() => {
    if (debouncedLocation) {
      console.log("[useEffect] Debounced location changed, fetching suggestions:", debouncedLocation);
      fetchLocationSuggestions(debouncedLocation);
    } else {
      console.log("[useEffect] Debounced location empty, clearing suggestions");
      setLocationSuggestions([]);
    }
  }, [debouncedLocation]);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      console.log("[useEffect] Initializing Quill editor");
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Enter job description here...",
      });
    }
  }, []);

  const fetchLocationSuggestions = async (input) => {
    if (!input) {
      setLocationSuggestions([]);
      console.log("[fetchLocationSuggestions] Empty input, cleared suggestions");
      return;
    }

    try {
      console.log("[fetchLocationSuggestions] Fetching suggestions for:", input);
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete`,
        {
          params: {
            text: input,
            apiKey: GEOAPIFY_API_KEY,
            limit: 5,
          },
        }
      );

      console.log("[fetchLocationSuggestions] API response received:", response.data);
      const suggestions = response.data.features.map(
        (feature) => feature.properties.formatted
      );
      setLocationSuggestions(suggestions);
      console.log("[fetchLocationSuggestions] Suggestions set:", suggestions);
    } catch (error) {
      console.error("[fetchLocationSuggestions] Error fetching location suggestions:", error);
      setLocationSuggestions([]);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const description = quillRef.current?.root?.innerHTML || "";
    console.log("[onSubmitHandler] Submitting form with values:");
    console.log("title:", title);
    console.log("description:", description);
    console.log("location:", location);
    console.log("salary:", salary);
    console.log("category:", category);
    console.log("level:", level);

    try {
      const response = await axios.post(
        `${backendUrl}/api/company/post-job`,
        { title, description, location, salary, category, level },
        {
          headers: { token: companyToken },
        }
      );

      console.log("[onSubmitHandler] Response from backend:", response.data);
      const data = response.data;
      const isSuccess = data.success || data.succes;

      if (isSuccess) {
        toast.success(data.message || "Job posted successfully!");
        // Reset form
        setTitle("");
        setSalary(0);
        setLocation("Bangalore");
        setCategory("Programming");
        setLevel("Beginner level");
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
        console.log("[onSubmitHandler] Form reset after successful post");
      } else {
        toast.error(data.message || "Something went wrong.");
        console.warn("[onSubmitHandler] Backend responded with failure:", data);
      }
    } catch (error) {
      console.error("[onSubmitHandler] Error submitting form:", error);
      toast.error(
        error?.response?.data?.message || error.message || "Unknown error"
      );
    }
  };

  return (
    <div className="relative max-w-lg mx-auto">
      <form
        onSubmit={onSubmitHandler}
        className="p-4 flex flex-col w-full items-start gap-3"
      >
        {/* Job Title */}
        <div className="w-full">
          <p className="mb-2">Job Title</p>
          <input
            type="text"
            placeholder="Type here"
            onChange={(e) => {
              console.log("[input] Job title changed:", e.target.value);
              setTitle(e.target.value);
            }}
            value={title}
            required
            className="w-full px-3 py-2 border-2 border-gray-300 rounded"
          />
        </div>

        {/* Job Description */}
        <div className="w-full max-w-lg">
          <p className="my-2">Job Description</p>
          <div
            ref={editorRef}
            className="border border-gray-300 rounded min-h-[150px]"
          ></div>
        </div>

        {/* Category, Location, Level */}
        <div className="flex gap-8 justify-center items-center w-full">
          {/* Category */}
          <div>
            <p className="mb-2">Job Category</p>
            <select
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
              onChange={(e) => {
                console.log("[select] Category changed:", e.target.value);
                setCategory(e.target.value);
              }}
              value={category}
            >
              {JobCategories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location with autocomplete */}
          <div className="relative w-full max-w-lg">
            <p className="mb-2">Job Location</p>
            <input
              type="text"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
              value={location}
              onChange={(e) => {
                console.log("[input] Location changed:", e.target.value);
                setLocation(e.target.value);
              }}
              placeholder="Enter a location"
              autoComplete="off"
            />
            {locationSuggestions.length > 0 && (
              <ul className="border border-gray-300 rounded max-h-48 overflow-y-auto bg-white absolute z-10 w-full">
                {locationSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      console.log("[click] Location suggestion selected:", suggestion);
                      setLocation(suggestion);
                      setLocationSuggestions([]);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Level */}
          <div>
            <p className="mb-2">Job Level</p>
            <select
              className="w-full px-3 py-2 border-2 border-gray-300 rounded"
              onChange={(e) => {
                console.log("[select] Level changed:", e.target.value);
                setLevel(e.target.value);
              }}
              value={level}
            >
              <option value="Beginner level">Beginner level</option>
              <option value="Intermediate level">Intermediate level</option>
              <option value="Senior level">Senior level</option>
            </select>
          </div>
        </div>

        {/* Salary */}
        <div>
          <p className="mb-2">Job Salary</p>
          <input
            min={0}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded sm:w-[120px]"
            onChange={(e) => {
              console.log("[input] Salary changed:", e.target.value);
              setSalary(Number(e.target.value));
            }}
            value={salary}
            type="number"
            placeholder="2500"
          />
        </div>

        <button
          type="submit"
          className="w-28 py-3 mt-4 bg-black text-white rounded"
        >
          ADD
        </button>
      </form>

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddJob;
