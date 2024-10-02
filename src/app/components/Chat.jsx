import { useState, useEffect, useRef } from "react";
import ArrowOut from "../assets/arrow_outward.svg";
import Stop from "../assets/stop.svg";
import Close from "../assets/close.svg";
import axios from "axios";

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
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInput = (event) => {
    const target = event.target;
    target.style.height = "50px"; // Reset height
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`; // Set new height (80px corresponds to max-h-20)
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return; // Prevent sending empty messages

    const newConversation = [
      ...conversation,
      { sender: "user", message: inputMessage },
    ];
    setConversation(newConversation); // Set conversation
    setInputMessage(""); // Clear input after sending
    setProcessing(true);

    try {
      // Call the backend API to get the AI response
      const response = await fetch("/api/groqChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      console.log(response);

      if (response.ok) {
        const formattedResponse = formatAIResponse(data.response);
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: formattedResponse },
        ]);
      } else {
        console.error("Error:", data.error);
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: "Failed to get a response from the AI." },
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
      scrollToBottom(); // Scroll to the bottom after getting the response
    }
  };
  const formatAIResponse = (text) => {
    let counter = 1;

    return text
      .replace(/\n/g, "<br/>") // Replace newlines with <br> for line breaks
      .replace(/\* (.*?)\n/g, () => `<br/><strong>${counter++}. </strong>`) // Replace '*' with increasing numbers
      .replace(/-?\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **text** to bold
      .replace(/(.*?):/g, "<strong>$1:</strong>") // Make headings bold (text followed by a colon)
      .replace(
        /(Benefits|How it Works|Tips for Use|Types of)/gi,
        "<h2 class='text-xl font-bold'>$1</h2>" // Larger, bold headers for main sections
      )
      .replace(
        /(Overview|Conclusion)/gi,
        "<h3 class='text-lg font-semibold'>$1</h3>" // Slightly smaller headers for sub-sections
      );
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log(process.env.NEXT_GROQ_API_KEY);
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${api}`
        );
        console.log(response.data.items);

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
                  className={`w-1/5 text-lg rounded-2xl text-white bg-zinc-900 p-2`}
                >
                  No
                </button>
                <button
                  className="w-1/5 text-lg rounded-2xl text-black bg-blue-100 font-semibold hover:text-black p-2 hover:bg-blue-200 duration-300"
                  onClick={() => setConfirmation(true)}
                >
                  Yes
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
                      : "justify-start w-full"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[100%] font-light ${
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
                className="bg-white m-1 w-12 h-12 rounded-full"
                onClick={handleSend}
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
