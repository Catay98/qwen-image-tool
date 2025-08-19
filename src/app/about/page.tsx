'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const teamMembers = [
    {
      name: language === 'zh' ? 'Michael Thompson' : 'Michael Thompson',
      role: language === 'zh' ? '创始人 & CEO' : 'Founder & CEO',
      description: language === 'zh' 
        ? '拥有10年人工智能领域经验，曾在多家顶级科技公司担任技术负责人，致力于让AI技术更加普及和易用。'
        : 'With 10 years of experience in AI, previously served as technical lead at top tech companies, dedicated to making AI technology more accessible and user-friendly.',
      emoji: '👨‍💼'
    },
    {
      name: language === 'zh' ? 'Sarah Williams' : 'Sarah Williams',
      role: language === 'zh' ? '首席技术官' : 'Chief Technology Officer',
      description: language === 'zh'
        ? '深度学习专家，专注于计算机视觉和图像生成技术，拥有多项AI相关专利。'
        : 'Deep learning expert specializing in computer vision and image generation, holds multiple AI-related patents.',
      emoji: '👩‍💻'
    },
    {
      name: language === 'zh' ? 'Robert Anderson' : 'Robert Anderson',
      role: language === 'zh' ? '产品总监' : 'Product Director',
      description: language === 'zh'
        ? '资深产品经理，擅长用户体验设计，曾成功打造多款百万用户级产品。'
        : 'Senior product manager with expertise in UX design, successfully launched multiple products with millions of users.',
      emoji: '🎨'
    },
    {
      name: language === 'zh' ? 'Emily Johnson' : 'Emily Johnson',
      role: language === 'zh' ? '运营总监' : 'Operations Director',
      description: language === 'zh'
        ? '拥有丰富的市场营销和用户增长经验，负责全球市场拓展和用户社区建设。'
        : 'Extensive experience in marketing and user growth, responsible for global market expansion and community building.',
      emoji: '📈'
    }
  ];

  const milestones = [
    {
      year: '2022',
      title: language === 'zh' ? '公司成立' : 'Company Founded',
      description: language === 'zh' 
        ? '怀着让AI图像生成技术惠及每个人的愿景，Qwen Image正式成立。'
        : 'With the vision of making AI image generation accessible to everyone, Qwen Image was officially founded.'
    },
    {
      year: '2023',
      title: language === 'zh' ? '产品发布' : 'Product Launch',
      description: language === 'zh'
        ? '经过一年的研发，我们推出了第一个版本，获得了用户的热烈欢迎。'
        : 'After a year of development, we launched our first version, receiving enthusiastic user reception.'
    },
    {
      year: '2024',
      title: language === 'zh' ? '全球扩张' : 'Global Expansion',
      description: language === 'zh'
        ? '用户突破100万，服务覆盖全球50多个国家和地区。'
        : 'Surpassed 1 million users, serving over 50 countries and regions worldwide.'
    },
    {
      year: language === 'zh' ? '未来' : 'Future',
      title: language === 'zh' ? '持续创新' : 'Continuous Innovation',
      description: language === 'zh'
        ? '不断优化技术，推出更多创新功能，成为全球领先的AI创作平台。'
        : 'Continuously optimizing technology, launching more innovative features to become a global leading AI creative platform.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <NavBar />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {language === 'zh' ? '关于我们' : 'About Us'}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {language === 'zh' 
              ? '我们是一支充满激情的团队，致力于通过人工智能技术让创意表达变得更加简单和有趣。'
              : 'We are a passionate team dedicated to making creative expression simpler and more enjoyable through artificial intelligence technology.'}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                {language === 'zh' ? '我们的使命' : 'Our Mission'}
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                {language === 'zh'
                  ? 'Qwen Image 的使命是让每个人都能成为创作者。通过先进的AI技术，我们打破了传统创作的技术门槛，让任何人都能将想象变为现实。'
                  : 'Qwen Image\'s mission is to enable everyone to become a creator. Through advanced AI technology, we break down the technical barriers of traditional creation, allowing anyone to turn imagination into reality.'}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {language === 'zh'
                  ? '我们相信创意不应该被技术限制，每个人都应该拥有表达自己想法的工具。'
                  : 'We believe creativity should not be limited by technology, and everyone should have the tools to express their ideas.'}
              </p>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-2xl flex items-center justify-center">
              <span className="text-8xl">🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            {language === 'zh' ? '核心价值观' : 'Core Values'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {language === 'zh' ? '创新' : 'Innovation'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'zh'
                  ? '持续探索AI技术的边界，为用户带来更强大、更智能的创作工具。'
                  : 'Continuously exploring the boundaries of AI technology to bring users more powerful and intelligent creative tools.'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {language === 'zh' ? '用户至上' : 'User First'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'zh'
                  ? '倾听用户声音，不断优化产品体验，确保每个功能都真正解决用户需求。'
                  : 'Listening to user feedback, continuously optimizing product experience, ensuring every feature truly addresses user needs.'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {language === 'zh' ? '品质' : 'Quality'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'zh'
                  ? '追求卓越品质，每一个细节都精心打磨，为用户提供最佳的使用体验。'
                  : 'Pursuing excellence, carefully crafting every detail to provide users with the best experience.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            {language === 'zh' ? '核心团队' : 'Core Team'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-6xl">
                  {member.emoji}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            {language === 'zh' ? '发展历程' : 'Our Journey'}
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-purple-600 to-blue-600"></div>
            
            {/* Timeline items */}
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="flex-1">
                    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                      <div className="text-purple-600 dark:text-purple-400 font-bold mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{milestone.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-purple-600 rounded-full border-4 border-white dark:border-gray-900 z-10"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            {language === 'zh' ? '加入我们的旅程' : 'Join Our Journey'}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            {language === 'zh'
              ? '无论您是用户、合作伙伴还是投资者，我们都期待与您一起创造更美好的未来。'
              : 'Whether you\'re a user, partner, or investor, we look forward to creating a better future together.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/generator"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              {language === 'zh' ? '开始创作' : 'Start Creating'}
            </Link>
            <a
              href="mailto:media@aiqwen.cc"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              {language === 'zh' ? '联系我们' : 'Contact Us'}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}