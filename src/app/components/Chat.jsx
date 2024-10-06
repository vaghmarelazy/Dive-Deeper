import { useState, useEffect, useRef } from "react";
import ArrowOut from "../assets/arrow_outward.svg";
import Stop from "../assets/stop.svg";
import Close from "../assets/close.svg";
import AiIcon from "../assets/6aEVc501.svg";
import axios from "axios";
import Image from "next/image";

function Chat({ videoId }) {
  const [inputMessage, setInputMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [conversation, setConversation] = useState([]); // To hold the full conversation
  const [confirmation, setConfirmation] = useState(false);
  const chatEndRef = useRef(null); // For auto-scrolling
  const api = "AIzaSyBphJE_76cQvqaG0r75MhERv-9Ka33etwU";

  // Scroll to the bottom of the chat area when a new message is added
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log(process.env.NEXT_PUBLIC_GROQ_API_KEY);
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${api}`
        );
        console.log(response.data.items[0]);

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
  }, [videoId]);

  async function preFetch() {
    setConfirmation(true);
    setProcessing(true);

    try {
      // Send the videoData to your AI model for summarization
      const response = await fetch("/api/groqChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoData }), // Send the entire video data
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // Use the AI's response to update the conversation or UI
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: formatAIResponse(data.response) },
        ]);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error sending video data:", error);
    } finally {
      setProcessing(false);
      scrollToBottom();
    }
  }

  const formatAIResponse = (text) => {
    let counter = 1;
    if (!text || text === "undefined") return ""; // Return empty if the response is invalid
  
    return text
      .replace(/\n/g, "<br/>") // Replace newlines with <br> for line breaks
      .replace(/\* (.*?)\n/g, () => `<br/><strong>${counter++}. </strong>`) // Replace '*' with increasing numbers
      .replace(/-?\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **text** to bold
      .replace(/(.*?):/g, "<strong>$1:</strong>") // Make headings bold (text followed by a colon)
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // Convert block code ```code``` to <pre><code>
      .replace(/`([^`]+)`/g, '<code>$1</code>'); // Convert inline `code` to <code>
  };
  

  const simulateTyping = (fullMessage, delay = 25) => {
    return new Promise((resolve) => {
      if (!fullMessage || fullMessage === "undefined") {
        resolve(); // Resolve immediately if the message is empty or undefined.
        return;
      }
  
      const words = fullMessage.trim().split(" "); // Trim the message to remove any extra spaces
      let index = 0;
  
      const updateConversation = () => {
        if (index < words.length) {
          setConversation((prev) => {
            const lastMessage = prev[prev.length - 1];
            const newMessage = 
              (lastMessage && lastMessage.sender === "ai" ? lastMessage.message : "") + 
              (index === 0 ? "" : " ") + 
              (words[index] || ""); // Ensure each word is not undefined
              
            if (lastMessage && lastMessage.sender === "ai") {
              return [
                ...prev.slice(0, prev.length - 1),
                { sender: "ai", message: newMessage },
              ];
            } else {
              return [...prev, { sender: "ai", message: newMessage }];
            }
          });
          index++;
          scrollToBottom(); // Scroll after each word
          setTimeout(updateConversation, delay);
        } else {
          resolve(); // Finish typing
        }
      };
  
      updateConversation();
    });
  };
  
  

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const newConversation = [
      ...conversation,
      { sender: "user", message: inputMessage },
    ];
    setConversation(newConversation);
    setInputMessage("");
    setProcessing(true);

    try {
      const response = await fetch("/api/groqChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      console.log(data);
      
      if (response.ok && data.response) {
        // Ensure data.response exists
        const formattedResponse = data.response;

        if (formattedResponse) {
          // Add an empty AI message, then simulate typing the full response
          setConversation((prev) => [...prev, { sender: "ai", message: "" }]);

          // Simulate typing one word at a time
          await simulateTyping(formattedResponse, 25);
        }
      } else {
        console.error("Error:", data.error);
        setConversation((prev) => [
          ...prev,
          {
            sender: "ai",
            message: "Failed to get a valid response from the AI.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setConversation((prev) => [
        ...prev,
        { sender: "ai", message: "Error generating AI response." },
      ]);
    } finally {
      setProcessing(false);
      scrollToBottom();
    }
  };

  const handleInput = (event) => {
    const target = event.target;
    target.style.height = "50px"; // Reset height
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`; // Set new height (80px corresponds to max-h-20)
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
                console.log("clicked");
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
              <iframe
                className="w-[90%] mx-auto h-72 rounded-2xl mt-4"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="5"
              ></iframe>
              <div className="w-[90%] mx-auto flex items-center justify-around my-4">
                <button
                  className="w-1/5 text-lg rounded-2xl text-black bg-blue-100 font-medium  p-2"
                  onClick={preFetch}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>

          <div className="w-full h-screen flex flex-col mx-auto gap-2">
            <h1 className="text-center text-5xl font-bold">
              Dive <span>Deeper</span> AI
            </h1>
            <div className="w-3/4 p-2 overflow-y-auto mx-auto h-[80vh] resize-none rounded-xl bg-stone-900 focus:outline-none">
              {/* Render the conversation */}
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start w-full "
                  }`}
                >
                  {/* Conditional rendering for AI icon */}
                  <span className="w-fit mt-2">
                    {msg.sender === "ai" && <AiIcon />}
                  </span>
                  <div
                    className={`px-4 pl-2 py-2 rounded-2xl max-w-[100%] font-light ${
                      msg.sender === "user" ? "bg-zinc-950 text-white" : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="w-3/4 mx-auto bg-stone-800 flex flex-row rounded-xl justify-between items-end">
              <textarea
                type="text"
                className="bg-transparent p-2 h-14 w-[90%] resize-none focus:outline-none break-words whitespace-pre-line bg-stone-800 items-end"
                placeholder="Ask Dive Deeper AI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
              ></textarea>
              <button
                className={`m-1 w-12 h-12 rounded-full ${
                  processing || inputMessage.trim() !== '' ? 'bg-white' : 'bg-zinc-400'
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
