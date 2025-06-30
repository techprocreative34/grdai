'use client';

type Artist = { name: string; style: string; imageUrl: string; };
interface ArtistPickerProps { artists: Artist[]; selectedValue: string; onChange: (value: string) => void; }

export default function ArtistPicker({ artists, selectedValue, onChange }: ArtistPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {artists.map((artist) => {
        const isSelected = selectedValue === artist.name;
        return (
          <div 
            key={artist.name} 
            onClick={() => onChange(isSelected ? '' : artist.name)}
            className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 group ${
              isSelected 
                ? 'border-red-500 scale-105 shadow-lg shadow-red-500/25' 
                : 'border-transparent hover:border-gray-500 hover:scale-102'
            }`}
          >
            {/* Image Container */}
            <div className="relative h-28 w-full overflow-hidden">
              <img 
                src={artist.imageUrl} 
                alt={artist.style} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm leading-tight line-clamp-1">
                  {artist.name}
                </h4>
                <p className="text-gray-200 text-xs leading-tight line-clamp-2 opacity-90">
                  {artist.style}
                </p>
              </div>
            </div>
            
            {/* Hover Effect Overlay */}
            <div className={`absolute inset-0 bg-red-500/10 opacity-0 transition-opacity duration-300 ${
              isSelected ? 'opacity-100' : 'group-hover:opacity-100'
            }`}></div>
          </div>
        );
      })}
    </div>
  );
}