async function test() {
  const baseUrl = 'http://localhost:3001/api/v1/auctions';
  
  const variants = ['ending-soon', 'live', 'upcoming'];
  
  for (const v of variants) {
    console.log(`\n--- VARIANT: ${v} ---`);
    const res = await fetch(`${baseUrl}?variant=${v}`);
    const data = await res.json();
    console.log(`Count: ${data.data.length}`);
    data.data.forEach((a: any) => {
      console.log(`- ${a.title} (Status: ${a.status}, EndTime: ${a.endTime})`);
    });
  }
}

test();
