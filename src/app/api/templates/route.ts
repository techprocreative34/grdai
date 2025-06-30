import { NextResponse } from 'next/server';

// Template data - in production, this could be stored in database
const templates = [
  {
    id: 'indo-portrait',
    title: 'Portrait Indonesia Tradisional',
    description: 'Template untuk membuat portrait dengan nuansa budaya Indonesia',
    category: 'photography',
    prompt: 'Portrait of a [GENDER] wearing traditional [REGION] clothing, [AGE] years old, [EXPRESSION] expression, sitting in [SETTING], golden hour lighting, shot with 85mm lens, shallow depth of field, warm color grading, cultural authenticity, detailed fabric textures',
    tags: ['portrait', 'traditional', 'indonesia', 'cultural'],
    difficulty: 'beginner',
    variables: [
      { name: 'GENDER', options: ['woman', 'man', 'person'] },
      { name: 'REGION', options: ['Jawa', 'Bali', 'Sumatra', 'Kalimantan', 'Sulawesi'] },
      { name: 'AGE', options: ['young', 'middle-aged', 'elderly'] },
      { name: 'EXPRESSION', options: ['serene', 'smiling', 'contemplative', 'proud'] },
      { name: 'SETTING', options: ['traditional Indonesian garden', 'wooden pavilion', 'rice field', 'temple courtyard'] }
    ]
  },
  {
    id: 'indo-landscape',
    title: 'Pemandangan Nusantara',
    description: 'Template untuk landscape Indonesia yang memukau',
    category: 'landscape',
    prompt: '[LOCATION] landscape in Indonesia, [TIME_OF_DAY], [WEATHER] weather, lush tropical vegetation, [WATER_FEATURE], dramatic clouds, vibrant colors, wide angle shot, high resolution, National Geographic style',
    tags: ['landscape', 'indonesia', 'nature', 'tropical'],
    difficulty: 'intermediate',
    variables: [
      { name: 'LOCATION', options: ['Borobudur temple', 'Mount Bromo', 'Raja Ampat', 'Lake Toba', 'Komodo Island'] },
      { name: 'TIME_OF_DAY', options: ['golden hour', 'blue hour', 'sunrise', 'sunset', 'midday'] },
      { name: 'WEATHER', options: ['clear', 'misty', 'dramatic stormy', 'partly cloudy'] },
      { name: 'WATER_FEATURE', options: ['flowing river', 'pristine lake', 'ocean waves', 'waterfall', 'hot springs'] }
    ]
  },
  {
    id: 'indo-food',
    title: 'Kuliner Indonesia',
    description: 'Template untuk food photography makanan Indonesia',
    category: 'product',
    prompt: '[FOOD_NAME] Indonesian dish, served on [PLATE_TYPE], garnished with [GARNISH], steam rising, warm lighting, rustic wooden table, banana leaf background, appetizing presentation, macro photography, food styling',
    tags: ['food', 'culinary', 'indonesia', 'photography'],
    difficulty: 'beginner',
    variables: [
      { name: 'FOOD_NAME', options: ['Nasi Gudeg', 'Rendang', 'Gado-gado', 'Sate Ayam', 'Nasi Padang'] },
      { name: 'PLATE_TYPE', options: ['traditional ceramic plate', 'banana leaf', 'wooden bowl', 'clay pot'] },
      { name: 'GARNISH', options: ['fresh herbs and chili', 'fried shallots', 'lime wedges', 'cucumber slices'] }
    ]
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    let filteredTemplates = templates;

    // Apply filters
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    if (difficulty && difficulty !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({ templates: filteredTemplates });

  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { templateId, variables } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Customize template with provided variables
    let customizedPrompt = template.prompt;
    
    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `[${key.toUpperCase()}]`;
        customizedPrompt = customizedPrompt.replace(new RegExp(placeholder, 'g'), value as string);
      });
    }

    // Replace any remaining placeholders with defaults
    template.variables?.forEach(variable => {
      const placeholder = `[${variable.name}]`;
      if (customizedPrompt.includes(placeholder)) {
        const defaultValue = variable.options[0];
        customizedPrompt = customizedPrompt.replace(new RegExp(placeholder, 'g'), defaultValue);
      }
    });

    return NextResponse.json({ 
      customizedPrompt,
      template: {
        id: template.id,
        title: template.title,
        category: template.category
      }
    });

  } catch (error) {
    console.error('Template customization error:', error);
    return NextResponse.json({ error: 'Failed to customize template' }, { status: 500 });
  }
}