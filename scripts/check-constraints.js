const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zppagpujfoclocaqfbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithValidStatus() {
  console.log('\n========== 测试有效的payment_status值 ==========\n');
  
  const userId = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6';
  
  // 尝试不同的payment_status值
  const statuses = ['pending', 'completed', 'failed', 'success', 'paid'];
  
  for (const status of statuses) {
    console.log(`测试 payment_status = '${status}':`);
    
    const testData = {
      user_id: userId,
      price: 9.99,
      points: 100,
      payment_status: status,
      payment_method: 'stripe'
    };
    
    const { data, error } = await supabase
      .from('points_purchase_records')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`  ❌ 失败: ${error.message}`);
    } else {
      console.log(`  ✅ 成功!`);
      if (data?.[0]?.id) {
        await supabase.from('points_purchase_records').delete().eq('id', data[0].id);
        console.log(`  已删除测试数据`);
      }
    }
  }
}

testWithValidStatus().catch(console.error);