'use client';

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">免责声明 / Disclaimer</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">网站声明 / Website Statement</h2>
            <p className="text-gray-700 mb-4">
              本网站 www.aiqwen.cc 是一个独立的AI图像生成服务平台，与阿里巴巴、通义千问或任何其他公司无关。
            </p>
            <p className="text-gray-700 mb-4">
              This website www.aiqwen.cc is an independent AI image generation service platform, not affiliated with Alibaba, Tongyi Qianwen, or any other companies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">服务说明 / Service Description</h2>
            <p className="text-gray-700 mb-4">
              我们提供基于开源AI模型的图像生成服务。所有支付通过正规的Stripe支付平台处理，确保安全可靠。
            </p>
            <p className="text-gray-700 mb-4">
              We provide image generation services based on open-source AI models. All payments are processed through the legitimate Stripe payment platform, ensuring safety and reliability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">联系方式 / Contact</h2>
            <p className="text-gray-700">
              如有任何问题，请联系：support@aiqwen.cc<br/>
              For any questions, please contact: support@aiqwen.cc
            </p>
          </section>

          <section className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800">安全提示 / Security Notice</h2>
            <p className="text-yellow-700">
              本网站不会索取您的密码、银行账户或其他敏感信息。所有支付均通过Stripe安全处理。
            </p>
            <p className="text-yellow-700 mt-2">
              This website will never ask for your passwords, bank accounts, or other sensitive information. All payments are securely processed through Stripe.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}