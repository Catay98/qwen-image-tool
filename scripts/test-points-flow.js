const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zppagpujfoclocaqfbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectInsert() {
  console.log('\n========== 测试直接插入积分购买记录 ==========\n');
  
  const userId = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6'; // 测试用户
  
  // 1. 最简单的插入测试
  console.log('1. 尝试最简单的插入（只包含必需字段）：');
  const simpleData = {
    user_id: userId,
    price: 9.99,
    points: 100,
    payment_status: 'test_simple'
  };
  
  console.log('   数据:', JSON.stringify(simpleData, null, 2));
  
  const { data: data1, error: error1 } = await supabase
    .from('points_purchase_records')
    .insert(simpleData)
    .select();
  
  if (error1) {
    console.error('   ❌ 失败:', error1.message);
    console.error('   错误代码:', error1.code);
    console.error('   错误详情:', error1.details);
    console.error('   错误提示:', error1.hint);
  } else {
    console.log('   ✅ 成功:', data1);
    if (data1?.[0]?.id) {
      // 清理测试数据
      await supabase.from('points_purchase_records').delete().eq('id', data1[0].id);
      console.log('   已删除测试数据');
    }
  }
  
  // 2. 测试包含更多字段
  console.log('\n2. 尝试包含更多字段的插入：');
  const moreFieldsData = {
    user_id: userId,
    package_name: '测试积分包',
    price: 19.99,
    points: 500,
    payment_method: 'stripe',
    payment_status: 'test_more',
    transaction_id: 'test_tx_' + Date.now()
  };
  
  console.log('   数据:', JSON.stringify(moreFieldsData, null, 2));
  
  const { data: data2, error: error2 } = await supabase
    .from('points_purchase_records')
    .insert(moreFieldsData)
    .select();
  
  if (error2) {
    console.error('   ❌ 失败:', error2.message);
  } else {
    console.log('   ✅ 成功:', data2);
    if (data2?.[0]?.id) {
      await supabase.from('points_purchase_records').delete().eq('id', data2[0].id);
      console.log('   已删除测试数据');
    }
  }
  
  // 3. 查看表中现有数据
  console.log('\n3. 查询表中现有数据：');
  const { data: existing, error: queryError } = await supabase
    .from('points_purchase_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (queryError) {
    console.error('   ❌ 查询失败:', queryError.message);
  } else {
    console.log(`   找到 ${existing?.length || 0} 条记录`);
    if (existing && existing.length > 0) {
      console.log('   最新记录:');
      existing.forEach(record => {
        console.log(`     - ${record.created_at}: ${record.package_name || '无名称'}, ${record.points}积分, 状态:${record.payment_status}`);
      });
      console.log('\n   第一条记录的所有字段:');
      console.log('   ', Object.keys(existing[0]).join(', '));
    }
  }
  
  // 4. 测试积分日志是否正常
  console.log('\n4. 检查积分日志表：');
  const { data: logs, error: logsError } = await supabase
    .from('points_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (logsError) {
    console.error('   ❌ 查询失败:', logsError.message);
  } else {
    console.log(`   找到 ${logs?.length || 0} 条日志`);
    logs?.forEach(log => {
      console.log(`     - ${log.created_at}: ${log.change_type} ${log.points_change}积分`);
    });
  }
  
  // 5. 检查用户积分余额
  console.log('\n5. 检查用户积分余额：');
  const { data: userPoints, error: pointsError } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (pointsError) {
    console.error('   ❌ 查询失败:', pointsError.message);
  } else {
    console.log(`   用户积分: 可用${userPoints.available_points}, 总计${userPoints.total_points}`);
  }
}

// 执行测试
testDirectInsert()
  .then(() => console.log('\n========== 测试完成 =========='))
  .catch(console.error);