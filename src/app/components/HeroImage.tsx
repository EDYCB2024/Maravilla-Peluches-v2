"use client";

import React, { useState } from "react";

interface HeroImageProps {
  initialSrc: string;
  fallbackSrc: string;
  alt: string;
}

export default function HeroImage({ initialSrc, fallbackSrc, alt }: HeroImageProps) {
  const [src, setSrc] = useState(initialSrc);

  return (
    <img
      className="w-full h-full object-cover"
      src={src}
      onError={() => setSrc(fallbackSrc)}
      alt={alt}
    />
  );
}
