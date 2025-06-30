'use client';
import { useState } from 'react';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: number;
  period: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonStyle: string;
  popular?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonStyle,
  popular = false,
  onSelect,
  disabled = false
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative bg-gray-900 rounded-2xl p-6 transition-all duration-300 ${
        popular 
          ? 'ring-2 ring-red-500 scale-105 shadow-2xl shadow-red-500/20' 
          : 'hover:bg-gray-800 hover:scale-102'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-red-500 to-red-700 text-white px-3 py-1 rounded-full text-xs font-bold">
            TERPOPULER
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="mb-2">
          <span className="text-3xl font-extrabold text-white">
            {price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`}
          </span>
          {price > 0 && (
            <span className="text-gray-400 text-sm ml-1">/{period}</span>
          )}
        </div>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg 
              className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${
                feature.included ? 'text-green-400' : 'text-gray-500'
              }`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              {feature.included ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
            <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={disabled}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
          disabled 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : buttonStyle
        } ${isHovered && !disabled ? 'transform scale-105' : ''}`}
      >
        {buttonText}
      </button>
    </div>
  );
}