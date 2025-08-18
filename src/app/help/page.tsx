"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useTranslation } from "react-i18next";

export default function HelpPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [activeSection, setActiveSection] = useState("getting-started");

  const helpSections =
    language === "zh"
      ? {
          "getting-started": {
            title: "开始使用",
            content: [
              {
                title: "注册账号",
                desc: '点击导航栏的"登录"按钮，使用Google账号快速注册。注册后即可获得免费使用次数。',
              },
              {
                title: "生成图像",
                desc: '在生成器页面输入您想要创建的图像描述，点击"生成图像"按钮即可。',
              },
              {
                title: "下载保存",
                desc: '生成完成后，点击"下载"按钮保存图像到本地。',
              },
            ],
          },
          features: {
            title: "功能介绍",
            content: [
              {
                title: "AI图像生成",
                desc: "使用先进的Qwen Image AI技术，根据文字描述生成高质量图像。",
              },
              {
                title: "多语言支持",
                desc: "支持中文和英文描述，自动识别语言并生成对应风格的图像。",
              },
              {
                title: "历史记录",
                desc: "自动保存您的生成历史，方便查看和重新使用之前的提示词。",
              },
              {
                title: "积分系统",
                desc: "灵活的积分系统，可以通过订阅或购买积分包来获得更多生成次数。",
              },
            ],
          },
          pricing: {
            title: "价格与订阅",
            content: [
              {
                title: "免费用户",
                desc: "10次免费生成机会，适合尝试和轻度使用。",
              },
              {
                title: "月度订阅",
                desc: "￥16.9/月，获得680积分，约可生成68张图像。",
              },
              {
                title: "年度订阅",
                desc: "￥118.8/年，获得8000积分，约可生成800张图像，更加优惠。",
              },
              { title: "积分包", desc: "可单独购买积分包，灵活补充积分。" },
            ],
          },
          tips: {
            title: "使用技巧",
            content: [
              {
                title: "详细描述",
                desc: "提供更详细的描述可以获得更精确的图像效果。包括风格、颜色、构图等。",
              },
              {
                title: "风格关键词",
                desc: '使用如"写实"、"卡通"、"油画"、"赛博朋克"等风格词汇。',
              },
              {
                title: "构图说明",
                desc: "说明视角（俯视、仰视、正面）和构图（特写、全景、中景）。",
              },
              {
                title: "质量词汇",
                desc: '添加"高清"、"8K"、"精细"等词汇提升图像质量。',
              },
            ],
          },
          troubleshooting: {
            title: "常见问题",
            content: [
              {
                title: "生成失败",
                desc: "请检查网络连接，确保积分充足。如问题持续，请联系客服。",
              },
              {
                title: "图像质量不满意",
                desc: "尝试调整描述词，添加更多细节和风格说明。",
              },
              {
                title: "积分不足",
                desc: "购买积分包/订阅套餐。",
              },
              {
                title: "登录问题",
                desc: "确保允许第三方Cookie，清除浏览器缓存后重试。",
              },
            ],
          },
        }
      : {
          "getting-started": {
            title: "Getting Started",
            content: [
              {
                title: "Create Account",
                desc: 'Click the "Login" button in the navigation bar to quickly register with your Google account. Get free uses upon registration.',
              },
              {
                title: "Generate Images",
                desc: 'Enter your image description on the generator page and click "Generate Image".',
              },
              {
                title: "Download & Save",
                desc: 'After generation, click the "Download" button to save the image locally.',
              },
            ],
          },
          features: {
            title: "Features",
            content: [
              {
                title: "AI Image Generation",
                desc: "Generate high-quality images from text descriptions using advanced Qwen Image AI technology.",
              },
              {
                title: "Multi-language Support",
                desc: "Supports Chinese and English descriptions, automatically recognizing language and generating corresponding styles.",
              },
              {
                title: "History",
                desc: "Automatically saves your generation history for easy review and reuse of previous prompts.",
              },
              {
                title: "Points System",
                desc: "Flexible points system - get more generations through subscriptions or points packages.",
              },
            ],
          },
          pricing: {
            title: "Pricing & Subscriptions",
            content: [
              {
                title: "Free Users",
                desc: "10 free generations total, perfect for trying out and light usage.",
              },
              {
                title: "Monthly Subscription",
                desc: "$16.9/month, get 680 points for about 68 image generations.",
              },
              {
                title: "Annual Subscription",
                desc: "$118.8/year, get 8000 points for about 800 image generations, better value.",
              },
              {
                title: "Points Packages",
                desc: "Purchase points packages separately for flexible point replenishment.",
              },
            ],
          },
          tips: {
            title: "Pro Tips",
            content: [
              {
                title: "Detailed Descriptions",
                desc: "Provide detailed descriptions for more accurate results. Include style, colors, composition, etc.",
              },
              {
                title: "Style Keywords",
                desc: 'Use style words like "photorealistic", "cartoon", "oil painting", "cyberpunk".',
              },
              {
                title: "Composition Notes",
                desc: "Specify perspective (bird's eye, low angle, front) and framing (close-up, panoramic, medium shot).",
              },
              {
                title: "Quality Terms",
                desc: 'Add "HD", "8K", "detailed" to enhance image quality.',
              },
            ],
          },
          troubleshooting: {
            title: "Troubleshooting",
            content: [
              {
                title: "Generation Failed",
                desc: "Check your internet connection and ensure sufficient points. Contact support if the issue persists.",
              },
              {
                title: "Unsatisfactory Quality",
                desc: "Try adjusting your description with more details and style specifications.",
              },
              {
                title: "Insufficient Points",
                desc: "Free users get 10 total uses. To continue generating, purchase points packages/subscriptions.",
              },
              {
                title: "Login Issues",
                desc: "Ensure third-party cookies are allowed, clear browser cache and try again.",
              },
            ],
          },
        };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen">
        <NavBar />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {language === "zh"
                    ? "Qwen Image 使用文档"
                    : "Qwen Image Documentation"}
                </span>
              </h1>
              <p className="text-lg text-gray-300">
                {language === "zh"
                  ? "了解如何使用 Qwen Image AI 创建惊艳的图像"
                  : "Learn how to create stunning images with Qwen Image AI"}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <div className="md:col-span-1">
                <div className="glass-card rounded-xl p-6 sticky top-20">
                  <h3 className="font-semibold text-white mb-4">
                    {language === "zh" ? "文档目录" : "Documentation"}
                  </h3>
                  <nav className="space-y-2">
                    {Object.entries(helpSections).map(([key, section]) => (
                      <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                          activeSection === key
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="md:col-span-3">
                <div className="glass-card rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {helpSections[activeSection].title}
                  </h2>

                  <div className="space-y-6">
                    {helpSections[activeSection].content.map((item, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-purple-500 pl-6"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-12 pt-8 border-t border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {language === "zh" ? "快速操作" : "Quick Actions"}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="/generator"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        {language === "zh" ? "开始创作" : "Start Creating"}
                      </a>
                      <a
                        href="/pricing"
                        className="px-6 py-3 glass-card text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                      >
                        {language === "zh" ? "查看价格" : "View Pricing"}
                      </a>
                      <a
                        href="mailto:media@aiqwen.cc"
                        className="px-6 py-3 glass-card text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                      >
                        {language === "zh" ? "联系支持" : "Contact Support"}
                      </a>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                    <h4 className="font-semibold text-white mb-2">
                      {language === "zh" ? "需要更多帮助？" : "Need More Help?"}
                    </h4>
                    <p className="text-gray-300 mb-3">
                      {language === "zh"
                        ? "如果您在文档中找不到答案，请随时联系我们的支持团队。"
                        : "If you can't find the answer in the documentation, feel free to contact our support team."}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-300">📧 media@aiqwen.cc</span>
                      <span className="text-gray-300">
                        💬 {language === "zh" ? "在线客服" : "Live Chat"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
