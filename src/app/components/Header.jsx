import React from "react";
import SvgDownArrow from "../assets/down_arrow.svg";

function Header() {
  return (
    <header className="bg-gray-200 w-full h-10">
      <div className="container text-black font-logo flex flex-col">
        <h1 className="text-3xl font-semibold flex mx-auto">
          DIVE{" "}
          <span>
            <SvgDownArrow width={40} height={40} />
          </span>{" "}
          DEEPER
        </h1>
      </div>
    </header>
  );
}

export default Header;
