(async ()=>{
  try{
    const key = 'AIzaSyCGb9vCC9O1WSlt6T9vf_BhVUMgLLRvy7I';
    const model = 'models/gemini-2.5-flash';
    const method = 'generateContent';
    const url = `https://generativelanguage.googleapis.com/v1/${model}:${method}?key=${key}`;
    console.log('URL', url);
    const body = { messages: [{ author: 'user', content: [{ type: 'text', text: 'Say hello' }] }] };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    console.log('status', r.status);
    const t = await r.text();
    console.log(t.substring(0,2000));
  }catch(e){
    console.error(e);
  }
})();
