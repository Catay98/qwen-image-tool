const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zppagpujfoclocaqfbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteFlow() {
  console.log('\n========== 测试完整的积分购买流程 ==========\n');
  
  const userId = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6';
  
  // 1. 获取可用的积分包
  console.log('1. 获取可用的积分包:');
  const { data: packages, error: packagesError } = await supabase
    .from('points_packages')
    .select('*')
    .order('price');
  
  if (packagesError) {
    console.error('获取积分包失败:', packagesError.message);
    return;
  }
  
  console.log('可用积分包:');
  packages.forEach(pkg => {
    console.log(`  - ${pkg.name}: $${pkg.price} = ${pkg.points}积分 (ID: ${pkg.id})`);
  });
  
  // 使用第一个积分包进行测试
  const testPackage = packages[0];
  console.log(`\n选择测试积分包: ${testPackage.name}`);
  
  // 2. 模拟Webhook处理（包含正确的metadata）
  console.log('\n2. 模拟Webhook处理积分包购买:');
  
  const sessionData = {
    id: 'cs_test_' + Date.now(),
    amount_total: testPackage.price * 100, // Stripe使用分为单位
    payment_intent: 'pi_test_' + Date.now(),
    customer_email: 'test@example.com',
    metadata: {
      userId: userId,
      type: 'points_package',  // 正确的类型
      packageId: testPackage.id,  // 使用实际的UUID
      packageName: testPackage.name,
      points: testPackage.points.toString(),
      bonusPoints: (testPackage.bonus_points || 0).toString(),
      totalPoints: (testPackage.total_points || testPackage.points).toString()
    }
  };
  
  console.log('Session metadata:', sessionData.metadata);
  
  // 3. 执行handlePointsPackagePurchase的逻辑
  console.log('\n3. 执行积分包购买逻辑:');
  
  // 构建购买记录数据（模拟webhook的逻辑）
  const purchaseData = {
    user_id: sessionData.metadata.userId,
    package_name: sessionData.metadata.packageName,
    price: sessionData.amount_total / 100,
    points: parseInt(sessionData.metadata.points),
    bonus_points: parseInt(sessionData.metadata.bonusPoints),
    total_points: parseInt(sessionData.metadata.totalPoints),
    payment_method: 'stripe',
    payment_status: 'completed',
    transaction_id: sessionData.payment_intent,
    payment_details: {
      session_id: sessionData.id,
      customer_email: sessionData.customer_email
    }
  };
  
  // 检查packageId是否是有效的UUID
  const packageId = sessionData.metadata.packageId;
  if (packageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId)) {
    purchaseData.package_id = packageId;
    console.log('✅ packageId 是有效的UUID');
  } else {
    console.log('❌ packageId 不是有效的UUID:', packageId);
  }
  
  console.log('\n准备插入的购买记录:');
  console.log(JSON.stringify(purchaseData, null, 2));
  
  // 4. 插入购买记录
  console.log('\n4. 插入购买记录:');
  const { data: purchaseRecord, error: purchaseError } = await supabase
    .from('points_purchase_records')
    .insert(purchaseData)
    .select()
    .single();
  
  if (purchaseError) {
    console.error('❌ 插入失败:', purchaseError.message);
    console.error('错误详情:', {
      code: purchaseError.code,
      details: purchaseError.details,
      hint: purchaseError.hint
    });
  } else {
    console.log('✅ 插入成功!');
    console.log('记录ID:', purchaseRecord.id);
    
    // 5. 更新用户积分
    console.log('\n5. 更新用户积分:');
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (pointsError && pointsError.code === 'PGRST116') {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: purchaseData.total_points,
          available_points: purchaseData.total_points,
          used_points: 0,
          total_recharge: purchaseData.price
        });
      
      if (insertError) {
        console.error('❌ 创建用户积分失败:', insertError.message);
      } else {
        console.log('✅ 创建用户积分成功');
      }
    } else if (!pointsError && userPoints) {
      const newTotal = userPoints.total_points + purchaseData.total_points;
      const newAvailable = userPoints.available_points + purchaseData.total_points;
      const newRecharge = userPoints.total_recharge + purchaseData.price;
      
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotal,
          available_points: newAvailable,
          total_recharge: newRecharge
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ 更新用户积分失败:', updateError.message);
      } else {
        console.log('✅ 更新用户积分成功');
        console.log(`  原有积分: ${userPoints.available_points}`);
        console.log(`  新增积分: ${purchaseData.total_points}`);
        console.log(`  现有积分: ${newAvailable}`);
      }
    }
    
    // 6. 验证记录
    console.log('\n6. 验证记录:');
    const { data: verifyData, error: verifyError } = await supabase
      .from('points_purchase_records')
      .select('*')
      .eq('id', purchaseRecord.id)
      .single();
    
    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
    } else {
      console.log('✅ 记录验证成功!');
      console.log('记录详情:');
      console.log(`  - ID: ${verifyData.id}`);
      console.log(`  - Package ID: ${verifyData.package_id}`);
      console.log(`  - Package Name: ${verifyData.package_name}`);
      console.log(`  - Points: ${verifyData.points}`);
      console.log(`  - Status: ${verifyData.payment_status}`);
    }
    
    // 清理测试数据（可选）
    console.log('\n是否要保留这条测试记录？（保留以验证实际效果）');
    console.log('记录已成功创建，ID:', purchaseRecord.id);
    
    // 如果要清理，取消注释下面的代码
    /*
    const { error: deleteError } = await supabase
      .from('points_purchase_records')
      .delete()
      .eq('id', purchaseRecord.id);
    
    if (!deleteError) {
      console.log('测试数据已清理');
    }
    */
  }
  
  // 7. 查看所有购买记录
  console.log('\n7. 查看所有购买记录:');
  const { data: allRecords, error: allError } = await supabase
    .from('points_purchase_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (allError) {
    console.error('查询失败:', allError.message);
  } else {
    console.log(`总共找到 ${allRecords.length} 条记录`);
    if (allRecords.length > 0) {
      console.log('\n最近的记录:');
      allRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.created_at}: ${record.package_name} - ${record.points}积分 - $${record.price} - ${record.payment_status}`);
      });
    }
  }
}

testCompleteFlow()
  .then(() => console.log('\n========== 测试完成 =========='))
  .catch(console.error);