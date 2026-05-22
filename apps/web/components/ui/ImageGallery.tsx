'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Props { images: { url: string; position: number }[] }

export function ImageGallery({ images }: Props) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const sorted = [...images].sort((a, b) => a.position - b.position);
  if (!sorted.length) return null;

  return (
    <>
      <div className="rounded-lg overflow-hidden bg-black">
        <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
          <Image
            src={sorted[selected].url}
            alt="Post image"
            width={800}
            height={500}
            className="w-full object-contain max-h-[500px]"
          />
        </div>
        {sorted.length > 1 && (
          <div className="flex gap-2 p-2 bg-gray-900">
            {sorted.map((img, i) => (
              <button key={img.url} onClick={() => setSelected(i)} className={`w-12 h-12 rounded overflow-hidden border-2 ${i === selected ? 'border-primary' : 'border-transparent'}`}>
                <Image src={img.url} alt="" width={48} height={48} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <Image src={sorted[selected].url} alt="Post image" width={1200} height={800} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
