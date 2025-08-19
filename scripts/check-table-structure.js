const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zppagpujfoclocaqfbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  console.log('\n========== 检查 points_purchase_records 表结构 ==========\n');
  
  // 尝试插入包含所有字段的记录
  const fullData = {
    user_id: '3306f2f7-88b6-4776-ba60-e41d89cfd7d6',
    package_id: 'test-pkg-id',
    package_name: '测试积分包',
    price: 29.99,
    points: 1000,
    bonus_points: 200,
    total_points: 1200,
    payment_method: 'stripe',
    payment_status: 'completed',
    transaction_id: 'test_tx_' + Date.now(),
    payment_details: {
      session_id: 'test_session',
      customer_email: 'test@example.com'
    }
  };
  
  console.log('尝试插入完整数据:');
  console.log(JSON.stringify(fullData, null, 2));
  
  const { data, error } = await supabase
    .from('points_purchase_records')
    .insert(fullData)
    .select();
  
  if (error) {
    console.error('\n❌ 插入失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误详情:', error.details);
    console.error('错误提示:', error.hint);
    
    // 尝试找出哪个字段有问题
    console.log('\n逐个字段测试...');
    
    // 测试必需字段
    const minimalData = {
      user_id: '3306f2f7-88b6-4776-ba60-e41d89cfd7d6',
      price: 9.99,
      points: 100,
      payment_status: 'pending'
    };
    
    const { data: data2, error: error2 } = await supabase
      .from('points_purchase_records')
      .insert(minimalData)
      .select();
    
    if (error2) {
      console.error('最小字段集也失败:', error2.message);
    } else {
      console.log('✅ 最小字段集成功!');
      
      // 逐个添加其他字段
      const fieldsToTest = [
        { field: 'package_id', value: 'test-pkg-id' },
        { field: 'package_name', value: '测试积分包' },
        { field: 'payment_method', value: 'stripe' },
        { field: 'bonus_points', value: 200 },
        { field: 'total_points', value: 300 },
        { field: 'transaction_id', value: 'test_tx_123' },
        { field: 'payment_details', value: { test: 'data' } }
      ];
      
      for (const { field, value } of fieldsToTest) {
        const testData = { ...minimalData, [field]: value };
        const { error: fieldError } = await supabase
          .from('points_purchase_records')
          .insert(testData)
          .select();
        
        if (fieldError) {
          console.log(`❌ 字段 '${field}' 导致错误:`, fieldError.message);
        } else {
          console.log(`✅ 字段 '${field}' 正常`);
        }
      }
      
      // 清理测试数据
      await supabase.from('points_purchase_records').delete().match({ user_id: '3306f2f7-88b6-4776-ba60-e41d89cfd7d6', price: 9.99 });
    }
  } else {
    console.log('\n✅ 插入成功!', data);
    if (data?.[0]?.id) {
      await supabase.from('points_purchase_records').delete().eq('id', data[0].id);
      console.log('已删除测试数据');
    }
  }
}

checkTableStructure().catch(console.error);
