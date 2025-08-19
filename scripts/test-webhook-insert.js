const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zppagpujfoclocaqfbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateWebhookInsert() {
  console.log('\n========== 模拟Webhook插入逻辑 ==========\n');
  
  const userId = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6';
  const packageId = 'not-a-valid-uuid'; // 模拟实际的packageId可能不是UUID
  const packageName = '300积分包';
  const points = 300;
  const bonusPoints = 0;
  const totalPoints = 300;
  const amount = 9.99;
  const sessionId = 'cs_test_' + Date.now();
  const paymentIntentId = 'pi_test_' + Date.now();
  
  // 模拟webhook的插入逻辑
  const purchaseData = {
    user_id: userId,
    package_name: packageName,
    price: amount,
    points: points,
    bonus_points: bonusPoints,
    total_points: totalPoints,
    payment_method: 'stripe',
    payment_status: 'completed',
    transaction_id: paymentIntentId,
    payment_details: {
      session_id: sessionId,
      customer_email: 'test@example.com'
    }
  };
  
  // 只有当packageId是有效的UUID时才添加
  if (packageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId)) {
    purchaseData.package_id = packageId;
    console.log('packageId 是有效的UUID，已添加到数据中');
  } else {
    console.log('packageId 不是有效的UUID，跳过该字段');
  }
  
  console.log('\n准备插入的数据:');
  console.log(JSON.stringify(purchaseData, null, 2));
  
  console.log('\n执行插入...');
  const { data, error } = await supabase
    .from('points_purchase_records')
    .insert(purchaseData)
    .select()
    .single();
  
  if (error) {
    console.error('\n❌ 插入失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误详情:', error.details);
  } else {
    console.log('\n✅ 插入成功!');
    console.log('创建的记录:', data);
    
    // 查询验证
    console.log('\n验证记录是否存在...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('points_purchase_records')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (verifyError) {
      console.error('验证失败:', verifyError.message);
    } else {
      console.log('✅ 记录验证成功!');
      console.log('记录详情:');
      console.log(`  - ID: ${verifyData.id}`);
      console.log(`  - 用户: ${verifyData.user_id}`);
      console.log(`  - 积分包: ${verifyData.package_name}`);
      console.log(`  - 积分: ${verifyData.points} (赠送: ${verifyData.bonus_points}, 总计: ${verifyData.total_points})`);
      console.log(`  - 金额: $${verifyData.price}`);
      console.log(`  - 状态: ${verifyData.payment_status}`);
      console.log(`  - 创建时间: ${verifyData.created_at}`);
    }
    
    // 清理测试数据
    console.log('\n清理测试数据...');
    const { error: deleteError } = await supabase
      .from('points_purchase_records')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('删除失败:', deleteError.message);
    } else {
      console.log('✅ 测试数据已清理');
    }
  }
  
  // 查看最近的购买记录
  console.log('\n\n========== 最近的购买记录 ==========');
  const { data: recentRecords, error: recentError } = await supabase
    .from('points_purchase_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentError) {
    console.error('查询失败:', recentError.message);
  } else {
    console.log(`找到 ${recentRecords?.length || 0} 条记录`);
    if (recentRecords && recentRecords.length > 0) {
      recentRecords.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  - 创建时间: ${record.created_at}`);
        console.log(`  - 积分包: ${record.package_name || '未命名'}`);
        console.log(`  - 积分: ${record.points}`);
        console.log(`  - 金额: $${record.price}`);
        console.log(`  - 状态: ${record.payment_status}`);
        console.log(`  - 用户ID: ${record.user_id}`);
      });
    }
  }
}

simulateWebhookInsert().catch(console.error);