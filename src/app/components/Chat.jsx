import { useState, useEffect, useRef, useContext } from "react";
import ArrowOut from "../assets/arrow_outward.svg";
import Stop from "../assets/stop.svg";
import Close from "../assets/close.svg";
import AiIcon from "../assets/6aEVc501.svg";
import axios from "axios";
import { ModelContext } from "./Hero";

function Chat({ videoId }) {
  const [inputMessage, setInputMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [conversation, setConversation] = useState([]); // To hold the full conversation
  const [confirmation, setConfirmation] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(""); // New state for showing processing text
  const chatEndRef = useRef(null); // For auto-scrolling
  const api = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const model  = useContext(ModelContext);
  console.log("Model in Chat :", model.model);

  // Scroll to the bottom of the chat area when a new message is added
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  };

  useEffect(() => {
    console.log("videoId",videoId)
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${api}`
        );
        // console.log("Response of fetching data",response)

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
  }, [videoId, api]);

  async function preFetch() {
    setConfirmation(true);
    setProcessing(true);
    setProcessingMessage("Fetching video data...");
    try {
      const response = await axios.post(`${window.origin}/api/prefetch`, {
        videoData,
        videoId,
        model
      });
      console.log("Response from the prefetch", response.data.transcriptText)
      const data = response.data.transcriptText;
      if (response.ok && data.response) {
        console.log("Got response", data.response);
        const formattedResponse = [...data.response];
        console.log("Formatted response", formattedResponse);

        setProcessingMessage("");
        setConversation((prev) => [
          ...prev,
          // { sender: "ai", message: formatAIResponse(formattedResponse) },
          {
            sender: "ai",
            message: formattedResponse
              .map((item) => formatAIResponse(item.text))
              .join(", "),
          },
        ]);
      } else {
        setProcessingMessage("");
        setConversation((prev) => [
          ...prev,
          {
            sender: "ai",
            message: "Failed to get a valid summary from the AI.",
          },
        ]);
      }
    } catch (error) {
      console.log(error)
      setConversation((prev) => [
        ...prev,
        { sender: "ai", message: "Error summarizing the video." },
      ]);
    } finally {
      setProcessing(false);
      scrollToBottom();
    }
  }

  const formatAIResponse = (text) => {
    let counter = 1;
    if (!text || text === "undefined") return "";

    return text
      .replace(/\n/g, "<br/>")
      .replace(/\* (.*?)\n/g, () => `<br/><strong>${counter++}. </strong>`)
      .replace(/-?\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(.*?):/g, "<strong>$1:</strong>")
      .replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const newConversation = [
      ...conversation,
      { sender: "user", message: inputMessage },
    ];
    setConversation(newConversation);
    setProcessing(true);
    setProcessingMessage("Thinking...");

    try {
      const response = await fetch("/api/groqChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          videoData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        const formattedResponse = data.response;
        setProcessingMessage("");
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: formatAIResponse(formattedResponse) },
        ]);
      } else {
        setConversation((prev) => [
          ...prev,
          {
            sender: "ai",
            message: "Failed to get a valid response from the AI.",
          },
        ]);
        setProcessingMessage("");
      }
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        { sender: "ai", message: "Error generating AI response." },
      ]);
    } finally {
      setProcessing(false);
      scrollToBottom();
      setProcessingMessage("");
    }
  };
  
  return (
    <>
      {videoId && (
        <div>
          <div
            className={`w-full h-screen absolute bg-black/50 flex items-center z-10 text-white justify-center ${
              confirmation ? "hidden" : "block"
            }`}
          >
            <button
              className="absolute m-auto top-[10%] bg-zinc-300 rounded-full p-3 duration-200 hover:bg-red-600 hover:rotate-90"
              onClick={(e) => {
                setConfirmation(!confirmation);
              }}
            >
              <Close />
            </button>
            <div className="w-2/5 bg-zinc-600 text-white z-10 rounded-xl absolute">
              <div className="flex mx-auto items-center justify-center">
                <h1 className="text-center text-xl font-medium">
                  Do you want to continue with this Video ?
                </h1>
              </div>
              {!iframeLoaded && (
                <div className="wrapper w-[90%] h-72 mx-auto mt-4 flex items-center justify-center">
                  <div className="dot"></div>
                  <span className="text">Loading</span>
                </div>
              )}
              <iframe
                className={`w-[90%] mx-auto h-72 rounded-2xl mt-4 ${
                  iframeLoaded ? "block" : "hidden"
                }`}
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="5"
                onLoad={() => setIframeLoaded(true)}
              ></iframe>
              <div className="w-[90%] mx-auto flex items-center justify-around my-4">
                <button
                  className={`w-1/5 text-lg rounded-2xl font-medium p-2 flex items-center justify-center ${
                    iframeLoaded
                      ? "bg-blue-100 text-black hover:bg-blue-200"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  }`}
                  onClick={preFetch}
                  disabled={!iframeLoaded}
                >
                  {iframeLoaded ? (
                    "Confirm"
                  ) : (
                    <div className="loader w-2/3"></div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full h-screen flex flex-col mx-auto gap-2">
            <h1 className="text-center text-5xl font-bold">
              Dive <span>Deeper</span> AI
            </h1>
            <div className="chat-container w-3/4 p-2 overflow-y-auto mx-auto h-[80vh] resize-none rounded-xl bg-stone-900 focus:outline-none">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start w-full "
                  }`}
                >
                  <span className="w-fit mt-2">
                    {msg.sender === "ai" && <AiIcon />}
                  </span>
                  <div
                    className={`px-4 pl-2 py-2 rounded-2xl max-w-[100%] font-light first-letter:uppercase ${
                      msg.sender === "user" ? "bg-zinc-950 text-white" : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                </div>
              ))}
              {processingMessage && (
                <div className="mb-4 flex justify-start w-full">
                  <div className="px-4 pl-2 py-2 rounded-2xl bg-gray-500 text-white max-w-[100%] font-light">
                    {processingMessage}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="w-3/4 mx-auto bg-stone-800 flex flex-row rounded-xl justify-between items-end">
              <textarea
                type="text"
                className="bg-transparent p-4 h-14 w-[90%] resize-none focus:outline-none break-words whitespace-pre-line bg-stone-800 items-end"
                placeholder="Ask Dive Deeper AI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                    setInputMessage("");
                  }
                }}
              ></textarea>
              <button
                className={`m-1 w-12 h-12 rounded-full ${
                  processing || inputMessage.trim() !== ""
                    ? "bg-white"
                    : "bg-zinc-400"
                }`}
                onClick={handleSend}
                disabled={!inputMessage.trim() || processing}
              >
                <span className="flex items-center justify-center p-2">
                  {processing ? <Stop /> : <ArrowOut />}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;
