import React from "react";
import AiIcon from "../assets/6aEVc501.svg";

function Message({ message, sender }) {
  return (
    <div
      className={`mb-4 flex ${
        sender === "user" ? "justify-end" : "justify-start w-full"
      }`}
    >
      {sender === "ai" && <AiIcon />}
      <div
        className={`px-4 pl-2 py-2 rounded-2xl max-w-[100%] font-light first-letter:uppercase ${
          sender === "user" ? "bg-zinc-950 text-white" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
}

export default Message;
