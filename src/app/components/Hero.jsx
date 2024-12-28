"use client";
import { useState, useRef, useEffect } from "react";
import Chat from "./Chat";
import Groq from "groq-sdk";


function Hero() {
  const [videoUrl, setVideoUrl] = useState("https://youtu.be/yNWHT0JdukQ?si=K3EwxmprCCByDGYd");
  const [videoId, setVideoId] = useState("");
  const [error, setError] = useState("");
  const [textareaHeight, setTextareaHeight] = useState("min-h-10");
  const [loading, setLoading] = useState(false);
  const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, dangerouslyAllowBrowser: true });

  const chatRef = useRef(null);

  // const getAvailableModels = async () => {
  //   return await groq.models.list();
  // };

  // const models = [];
  // getAvailableModels().then(model =>{
  //   models.push(...model.data)
  //   console.log("MODELS:", models); // Log models after they are fetched
  // });

  // // for(const model of models){
  // //   console.log("MODELS",model)
  // // }
  // console.log(models);


  const extractVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      // Handle URLs in the format: https://www.youtube.com/watch?v=HblSXu2EuaU
      if (
        urlObj.hostname === "www.youtube.com" ||
        urlObj.hostname === "youtube.com"
      ) {
        return urlObj.searchParams.get("v");
      }

      // Handle URLs in the format: https://youtu.be/HblSXu2EuaU
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1); // Extract the video ID from the path
      }
    } catch (error) {
      return null;
    }
  };

  // Function to initialize the video player
  const initializeVideoPlayer = () => {
    setLoading(true);
    const id = extractVideoId(videoUrl);

    if (!id) {
      setError("Please enter a valid YouTube URL.");
      setVideoId("");
      setLoading(false);
      return;
    }

    setVideoId(id);
    setLoading(false);
    setError(""); // Clear any previous errors
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      initializeVideoPlayer();
    }
  };

  // Scroll to chat when videoId changes
  useEffect(() => {
    if (videoId && chatRef.current) { 
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [videoId]);

  return (
    <div>
      <logo className="h-auto flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold font-poppins mx-auto mt-10 w-fit ">
          Let&apos;s <span className="text-red-600">Dive</span> In
        </h1>
        <p className="font-thin font-poppins mx-auto w-fit ">
          Lets dive Deeper what Exites you with AI
        </p>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste youtube video link here"
          className="w-1/2 p-2 rounded-md bg-gray-800 text-white text-center mt-4"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              initializeVideoPlayer();
            }
          }} 
        />
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-xl mt-4"
          onClick={initializeVideoPlayer}
        >
          {loading ? "Loading..." : "Let's Dive"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {/* This is where the YouTube iframe will be rendered */}
        {videoId && (
          <iframe
            className="w-1/4 h-72 rounded-2xl mt-4"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
          ></iframe>
        )}
      </logo>
      {videoId && <div ref={chatRef}><Chat videoId={videoId}/></div>}
    </div>
  );
}

export default Hero;
