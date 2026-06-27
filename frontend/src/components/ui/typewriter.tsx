"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = ["LEARNING", "CODING", "MASTERING", "BUILDING"];
const colors = [
  "from-indigo-400 via-purple-400 to-pink-400", // LEARNING
  "from-emerald-400 via-teal-400 to-cyan-400", // CODING
  "from-amber-400 via-orange-400 to-red-400",  // MASTERING
  "from-blue-400 via-indigo-400 to-violet-400", // BUILDING
];

export function Typewriter() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index];
    let timer: NodeJS.Timeout;

    if (!isDeleting && text === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), 1500);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
    } else {
      timer = setTimeout(() => {
        setText((prev) =>
          isDeleting
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1)
        );
      }, isDeleting ? 50 : 100);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index]);

  return (
    <div className="relative inline-block w-full text-center">
      <span className={`inline-block bg-gradient-to-r ${colors[index]} bg-clip-text text-transparent`}>
        {text}
        <span className="animate-pulse ml-1 text-primary">|</span>
      </span>
    </div>
  );
}
