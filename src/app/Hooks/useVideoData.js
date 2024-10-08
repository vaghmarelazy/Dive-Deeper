import { useState, useEffect } from "react";
import axios from "axios";

const useVideoData = (videoId, apiKey) => {
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
        );

        if (response.data.items && response.data.items.length > 0) {
          setVideoData(response.data.items[0]);
        } else {
          console.error("No video data found for the given ID.");
          setVideoData(null);
        }
      } catch (error) {
        console.error("Error fetching video data:", error);
        setVideoData(null);
      }
    };

    fetchData();
  }, [videoId, apiKey]);

  return videoData;
};

export default useVideoData;