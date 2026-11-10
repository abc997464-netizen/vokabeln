// Holt Vokabeln aus einem Foto. Der Key liegt nur als Umgebungsvariable bei Netlify.
const PROMPT='Das Foto zeigt eine Vokabelliste aus einem Schulbuch oder Heft. Lies alle Vokabelpaare. Antworte NUR mit einem JSON-Array: [{"f":"Begriff in der Fremdsprache","b":"deutsche Bedeutung"}]. Mehrere Bedeutungen trennst du mit Semikolon. Ignoriere Überschriften, Seitenzahlen und Beispielsätze. Ist kein Vokabeltext erkennbar, antworte mit [].';
exports.handler=async(e)=>{
  if(e.httpMethod!=="POST")return{statusCode:405,body:"POST only"};
  let b;try{b=JSON.parse(e.body)}catch{return{statusCode:400,body:"bad request"}}
  if(process.env.CLASS_CODE&&b.code!==process.env.CLASS_CODE)return{statusCode:401,body:"wrong code"};
  if(!b.image||b.image.length>6e6)return{statusCode:413,body:"image missing or too large"};
  const model=process.env.GEMINI_MODEL||"gemini-2.5-flash";
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:"image/jpeg",data:b.image}}]}]})});
    if(!r.ok)return{statusCode:502,body:"gemini error "+r.status};
    const j=await r.json();
    return{statusCode:200,body:j.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"[]"};
  }catch{return{statusCode:502,body:"gemini unreachable"}}
};
