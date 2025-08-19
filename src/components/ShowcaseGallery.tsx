'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Map English categories and styles to keys for translation
const getCategoryKey = (category: string): string => {
  const map: {[key: string]: string} = {
    "Portrait": "portrait",
    "Fantasy": "fantasy",
    "Sci-Fi": "scifi",
    "Nature": "nature",
    "Steampunk": "steampunk",
    "Abstract": "abstract",
    "Retro": "retro",
    "Art Nouveau": "artNouveau"
  };
  return map[category] || category.toLowerCase();
};

const getStyleKey = (style: string): string => {
  const map: {[key: string]: string} = {
    "Photorealistic": "photorealistic",
    "Digital Art": "digitalArt",
    "Concept Art": "conceptArt",
    "Anime": "anime",
    "Photography": "photography",
    "3D Render": "3dRender",
    "Illustration": "illustration",
    "Minimalist": "minimalist",
    "Vintage Sci-Fi": "vintageSciFi"
  };
  return map[style] || style.toLowerCase();
};

// High-quality AI-generated image examples - using local images
const showcaseImages = [
  {
    id: 1,
    image: "/images/showcase/oriental-beauty-hanfu.jpg",
    category: "Portrait",
    style: "Photorealistic"
  },
  {
    id: 2,
    image: "/images/showcase/ice-phoenix-mountain.jpg",
    category: "Fantasy",
    style: "Digital Art"
  },
  {
    id: 3,
    image: "/images/showcase/cyberpunk-shanghai-night.jpg",
    category: "Sci-Fi",
    style: "Concept Art"
  },
  {
    id: 4,
    image: "/images/showcase/magical-forest-elves.jpg",
    category: "Fantasy",
    style: "Anime"
  },
  {
    id: 5,
    image: "/images/showcase/steampunk-mechanical-dragon.jpg",
    category: "Steampunk",
    style: "Photorealistic"
  },
  {
    id: 6,
    image: "/images/showcase/chinese-garden-sunset.jpg",
    category: "Nature",
    style: "Photography"
  },
  {
    id: 7,
    image: "/images/showcase/astronaut-space-station.jpg",
    category: "Sci-Fi",
    style: "3D Render"
  },
  {
    id: 8,
    image: "/images/showcase/art-nouveau-oriental.jpg",
    category: "Art Nouveau",
    style: "Illustration"
  },
  {
    id: 9,
    image: "/images/showcase/underwater-dragon-palace.jpg",
    category: "Fantasy",
    style: "Digital Art"
  },
  {
    id: 10,
    image: "/images/showcase/modern-abstract-digital.jpg",
    category: "Abstract",
    style: "Minimalist"
  },
  {
    id: 11,
    image: "/images/showcase/female-general-armor.jpg",
    category: "Portrait",
    style: "Concept Art"
  },
  {
    id: 12,
    image: "/images/showcase/retro-space-diner.jpg",
    category: "Retro",
    style: "Vintage Sci-Fi"
  }
];

// Use local showcase data directly
const showcaseData = showcaseImages;

const categoryKeys = ["all", "portrait", "fantasy", "scifi", "nature", "steampunk", "abstract", "retro", "artNouveau"];

export default function ShowcaseGallery() {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredImages, setFilteredImages] = useState(showcaseData);
  const [selectedImage, setSelectedImage] = useState<typeof showcaseData[0] | null>(null);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredImages(showcaseData);
    } else {
      const categoryMap: {[key: string]: string} = {
        "portrait": "Portrait",
        "fantasy": "Fantasy",
        "scifi": "Sci-Fi",
        "nature": "Nature",
        "steampunk": "Steampunk",
        "abstract": "Abstract",
        "retro": "Retro",
        "artNouveau": "Art Nouveau"
      };
      setFilteredImages(showcaseData.filter(img => img.category === categoryMap[selectedCategory]));
    }
  }, [selectedCategory]);

  return (
    <section className="py-20 px-4 showcase-section" id="showcase">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {t('showcase.title')}
          </h2>
          <p className="text-lg text-gray-200 dark:text-gray-300 max-w-2xl mx-auto">
            {t('showcase.subtitle')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categoryKeys.map((categoryKey) => (
            <button
              key={categoryKey}
              onClick={() => setSelectedCategory(categoryKey)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 ${
                selectedCategory === categoryKey
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t(`showcase.categories.${categoryKey}`, categoryKey)}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredImages.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                <img
                  src={item.image}
                  alt={t(`showcase.prompts.${item.id}`)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                      {t(`showcase.prompts.${item.id}`)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        {t(`showcase.categories.${getCategoryKey(item.category)}`, item.category)}
                      </span>
                      <span className="text-xs text-white/80 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        {t(`showcase.styles.${getStyleKey(item.style)}`, item.style)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Download image
                      const link = document.createElement('a');
                      link.href = item.image;
                      link.download = `qwen-image-${item.id}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    Qwen Image AI
                  </span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-gray-600 dark:text-gray-400">4.9</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 font-medium">
                  {t(`showcase.prompts.${item.id}`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:shadow-xl transform transition-all hover:scale-105">
            {t('showcase.loadMore')}
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                <img
                  src={selectedImage.image}
                  alt={t(`showcase.prompts.${selectedImage.id}`)}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">{t('showcase.details')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('showcase.prompt')}</label>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{t(`showcase.prompts.${selectedImage.id}`)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('showcase.category')}</label>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{t(`showcase.categories.${getCategoryKey(selectedImage.category)}`, selectedImage.category)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('showcase.style')}</label>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{t(`showcase.styles.${getStyleKey(selectedImage.style)}`, selectedImage.style)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                      {t('showcase.usePrompt')}
                    </button>
                    <button 
                      onClick={() => {
                        // Download image
                        const link = document.createElement('a');
                        link.href = selectedImage.image;
                        link.download = `qwen-image-${selectedImage.id}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}