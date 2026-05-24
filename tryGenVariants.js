(async ()=>{
  const key = 'AIzaSyCGb9vCC9O1WSlt6T9vf_BhVUMgLLRvy7I';
  const GL_HOST = 'https://generativelanguage.googleapis.com';
  try{
    const modelsRes = await fetch(`${GL_HOST}/v1/models?key=${key}`);
    const modelsText = await modelsRes.text();
    const models = JSON.parse(modelsText);
    const genModel = models.models.find(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.length>0 && (m.supportedGenerationMethods.includes('generateContent')||m.supportedGenerationMethods.includes('generate')||m.supportedGenerationMethods.includes('predict')));
    console.log('trying model', genModel.name, genModel.supportedGenerationMethods);
    const methods = genModel.supportedGenerationMethods;
    const variants = [
      { prompt: { text: 'Hello' } },
      { input: { text: 'Hello' } },
      { instances: [{ content: 'Hello' }] },
      { messages: [{ author: 'user', content: [{ type: 'text', text: 'Hello' }] }] },
      { input: 'Hello' },
      { text: 'Hello' },
      { content: 'Hello' }
    ];
    for(const method of methods){
      for(const body of variants){
        const url = `${GL_HOST}/v1/${genModel.name}:${method}?key=${key}`;
        try{
          const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
          const t = await r.text();
          console.log('Tried', method, 'with body', JSON.stringify(body), '=>', r.status);
          if(r.ok){
            console.log('Success:', t.substring(0,2000));
            return;
          } else {
            console.log('Response:', t.substring(0,500));
          }
        }catch(e){
          console.error('fetch err', e.message);
        }
      }
    }
    console.log('No variant succeeded');
  }catch(e){
    console.error(e);
  }
})();
