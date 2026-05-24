(async ()=>{
  try{
    const key = 'AIzaSyCGb9vCC9O1WSlt6T9vf_BhVUMgLLRvy7I';
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    const r = await fetch(url);
    console.log('status', r.status);
    const t = await r.text();
    console.log(t.substring(0,2000));
  }catch(e){
    console.error(e);
  }
})();
