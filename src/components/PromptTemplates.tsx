'use client';
import { useState } from 'react';

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'photography' | 'art' | 'character' | 'landscape' | 'product' | 'architecture';
  prompt: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  preview?: string;
}

const promptTemplates: PromptTemplate[] = [
  {
    id: 'indo-portrait',
    title: 'Portrait Indonesia Tradisional',
    description: 'Template untuk membuat portrait dengan nuansa budaya Indonesia',
    category: 'photography',
    prompt: 'Portrait of a [GENDER] wearing traditional [REGION] clothing, [AGE] years old, [EXPRESSION] expression, sitting in [SETTING], golden hour lighting, shot with 85mm lens, shallow depth of field, warm color grading, cultural authenticity, detailed fabric textures',
    tags: ['portrait', 'traditional', 'indonesia', 'cultural'],
    difficulty: 'beginner'
  },
  {
    id: 'indo-landscape',
    title: 'Pemandangan Nusantara',
    description: 'Template untuk landscape Indonesia yang memukau',
    category: 'landscape',
    prompt: '[LOCATION] landscape in Indonesia, [TIME_OF_DAY], [WEATHER] weather, lush tropical vegetation, [WATER_FEATURE], dramatic clouds, vibrant colors, wide angle shot, high resolution, National Geographic style',
    tags: ['landscape', 'indonesia', 'nature', 'tropical'],
    difficulty: 'intermediate'
  },
  {
    id: 'indo-food',
    title: 'Kuliner Indonesia',
    description: 'Template untuk food photography makanan Indonesia',
    category: 'product',
    prompt: '[FOOD_NAME] Indonesian dish, served on [PLATE_TYPE], garnished with [GARNISH], steam rising, warm lighting, rustic wooden table, banana leaf background, appetizing presentation, macro photography, food styling',
    tags: ['food', 'culinary', 'indonesia', 'photography'],
    difficulty: 'beginner'
  },
  {
    id: 'batik-pattern',
    title: 'Motif Batik Modern',
    description: 'Template untuk desain batik dengan sentuhan modern',
    category: 'art',
    prompt: 'Modern batik pattern inspired by [TRADITIONAL_MOTIF], [COLOR_SCHEME] color palette, geometric elements, flowing lines, cultural symbolism, seamless pattern, high contrast, digital art style, contemporary interpretation',
    tags: ['batik', 'pattern', 'modern', 'traditional'],
    difficulty: 'advanced'
  },
  {
    id: 'wayang-character',
    title: 'Karakter Wayang Modern',
    description: 'Template untuk karakter wayang dengan gaya kontemporer',
    category: 'character',
    prompt: '[CHARACTER_NAME] wayang character in modern style, [POSE] pose, traditional costume with contemporary elements, dramatic lighting, shadow play effects, cultural authenticity, digital illustration, detailed ornaments',
    tags: ['wayang', 'character', 'traditional', 'modern'],
    difficulty: 'advanced'
  },
  {
    id: 'indo-architecture',
    title: 'Arsitektur Tradisional',
    description: 'Template untuk arsitektur tradisional Indonesia',
    category: 'architecture',
    prompt: 'Traditional [REGION] architecture, [BUILDING_TYPE], wooden structure, intricate carvings, [ROOF_STYLE] roof, surrounded by tropical plants, golden hour lighting, architectural photography, cultural heritage, detailed craftsmanship',
    tags: ['architecture', 'traditional', 'indonesia', 'heritage'],
    difficulty: 'intermediate'
  }
];

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Semua', icon: '🎨' },
    { id: 'photography', name: 'Fotografi', icon: '📸' },
    { id: 'art', name: 'Seni', icon: '🎭' },
    { id: 'character', name: 'Karakter', icon: '👤' },
    { id: 'landscape', name: 'Pemandangan', icon: '🏞️' },
    { id: 'product', name: 'Produk', icon: '🍽️' },
    { id: 'architecture', name: 'Arsitektur', icon: '🏛️' }
  ];

  const difficulties = [
    { id: 'all', name: 'Semua Level', color: 'text-gray-400' },
    { id: 'beginner', name: 'Pemula', color: 'text-green-400' },
    { id: 'intermediate', name: 'Menengah', color: 'text-yellow-400' },
    { id: 'advanced', name: 'Mahir', color: 'text-red-400' }
  ];

  const filteredTemplates = promptTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleUseTemplate = (template: PromptTemplate) => {
    // Show modal with customization options
    const customizedPrompt = customizeTemplate(template.prompt);
    onSelectTemplate(customizedPrompt);
  };

  const customizeTemplate = (templatePrompt: string): string => {
    // Simple customization - in real app, this would be a modal with form inputs
    let customized = templatePrompt;
    
    // Replace common placeholders with defaults
    const replacements = {
      '[GENDER]': 'woman',
      '[REGION]': 'Jawa',
      '[AGE]': '25',
      '[EXPRESSION]': 'serene',
      '[SETTING]': 'traditional Indonesian garden',
      '[LOCATION]': 'Borobudur temple',
      '[TIME_OF_DAY]': 'golden hour',
      '[WEATHER]': 'clear',
      '[WATER_FEATURE]': 'flowing river',
      '[FOOD_NAME]': 'Nasi Gudeg',
      '[PLATE_TYPE]': 'traditional ceramic plate',
      '[GARNISH]': 'fresh herbs and chili',
      '[TRADITIONAL_MOTIF]': 'parang rusak',
      '[COLOR_SCHEME]': 'earth tone',
      '[CHARACTER_NAME]': 'Arjuna',
      '[POSE]': 'heroic standing',
      '[BUILDING_TYPE]': 'rumah adat',
      '[ROOF_STYLE]': 'joglo'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      customized = customized.replace(new RegExp(placeholder, 'g'), value);
    });

    return customized;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎨 Template Prompt Indonesia</h2>
        <p className="text-gray-400">Gunakan template siap pakai dengan nuansa budaya Indonesia</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Cari template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {difficulties.map(difficulty => (
            <button
              key={difficulty.id}
              onClick={() => setSelectedDifficulty(difficulty.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedDifficulty === difficulty.id
                  ? 'bg-red-600 text-white'
                  : `bg-gray-700 ${difficulty.color} hover:bg-gray-600`
              }`}
            >
              {difficulty.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-white">{template.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                template.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                template.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {template.difficulty === 'beginner' ? 'Pemula' :
                 template.difficulty === 'intermediate' ? 'Menengah' : 'Mahir'}
              </span>
            </div>
            
            <p className="text-gray-400 text-sm mb-3">{template.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="bg-gray-700 rounded p-3 mb-4">
              <p className="text-gray-300 text-sm font-mono line-clamp-3">
                {template.prompt}
              </p>
            </div>
            
            <button
              onClick={() => handleUseTemplate(template)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              🚀 Gunakan Template
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Template Ditemukan</h3>
          <p className="text-gray-400">Coba ubah filter atau kata kunci pencarian Anda.</p>
        </div>
      )}
    </div>
  );
}