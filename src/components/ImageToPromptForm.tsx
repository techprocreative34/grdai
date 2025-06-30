// src/components/ImageToPromptForm.tsx
'use client';
import { useState, ChangeEvent } from 'react';

interface ImageToPromptFormProps {
  onImageUploaded: (file: File) => void;
  isAnalyzing: boolean;
  credits: number | null;
}

export default function ImageToPromptForm({ onImageUploaded, isAnalyzing, credits }: ImageToPromptFormProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUploaded(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-white">Analisa Gambar untuk Prompt</h2>
      <p className="text-gray-400">Unggah sebuah gambar, dan biarkan AI kami menganalisanya untuk membuat deskripsi prompt yang detail.</p>

      {credits !== null && (
        <p className="text-amber-400 font-semibold mb-4">
          Sisa kuota analisa gratis bulan ini: {credits}
        </p>
      )}

      <div className="w-full h-64 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center relative">
        {preview ? (
          <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
        ) : (
          <p className="text-gray-500">Pratinjau gambar akan muncul di sini</p>
        )}
      </div>

      <input type="file" id="imageUpload" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
      <label htmlFor="imageUpload" className={`w-full inline-block px-6 py-3 font-bold rounded-md transition-all text-white ${isAnalyzing ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`}>
        {isAnalyzing ? "Sedang Menganalisa..." : "Pilih Gambar"}
      </label>
    </div>
  );
}