'use client';

import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-24 pb-12" style={{ background: 'white !important', backgroundColor: 'white !important' }}>
        <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-black">免责声明 / Disclaimer</h1>
        
        <div className="border-2 border-black rounded-lg p-8 space-y-6" style={{ background: 'white' }}>
          <section className="border-b-2 border-gray-200 pb-6">
            <h2 className="text-2xl font-bold mb-4 text-black">网站声明 / Website Statement</h2>
            <p className="text-black font-semibold text-lg mb-4">
              本网站 www.aiqwen.cc 是一个独立的AI图像生成服务平台，与阿里巴巴、通义千问或任何其他公司无关。
            </p>
            <p className="text-black font-semibold text-lg">
              This website www.aiqwen.cc is an independent AI image generation service platform, not affiliated with Alibaba, Tongyi Qianwen, or any other companies.
            </p>
          </section>

          <section className="border-b-2 border-gray-200 pb-6">
            <h2 className="text-2xl font-bold mb-4 text-black">服务说明 / Service Description</h2>
            <p className="text-black font-medium text-lg mb-4">
              我们提供基于开源AI模型的图像生成服务。所有支付通过正规的Stripe支付平台处理，确保安全可靠。
            </p>
            <p className="text-black font-medium text-lg">
              We provide image generation services based on open-source AI models. All payments are processed through the legitimate Stripe payment platform, ensuring safety and reliability.
            </p>
          </section>

          <section className="border-b-2 border-gray-200 pb-6">
            <h2 className="text-2xl font-bold mb-4 text-black">联系方式 / Contact</h2>
            <p className="text-black font-medium text-lg">
              如有任何问题，请联系：<span className="font-bold underline">support@aiqwen.cc</span><br/>
              For any questions, please contact: <span className="font-bold underline">support@aiqwen.cc</span>
            </p>
          </section>

          <section className="bg-yellow-100 border-2 border-yellow-600 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-black flex items-center gap-2">
              <span>⚠️</span>
              安全提示 / Security Notice
            </h2>
            <p className="text-black font-bold text-lg mb-3">
              本网站不会索取您的密码、银行账户或其他敏感信息。所有支付均通过Stripe安全处理。
            </p>
            <p className="text-black font-bold text-lg">
              This website will never ask for your passwords, bank accounts, or other sensitive information. All payments are securely processed through Stripe.
            </p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}