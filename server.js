require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json({limit:"1mb"}));
app.use(express.static(__dirname));
app.post("/api/analyze", async (req,res) => {
  try {
    const {type,text,interests="",source=""}=req.body||{};
    if(!process.env.GEMINI_API_KEY)return res.status(500).json({error:"مفتاح Gemini غير مضبوط في ملف .env"});
    if(!text||!["mirsad","worth"].includes(type))return res.status(400).json({error:"بيانات الطلب غير مكتملة"});
    const prompt=type==="mirsad"
      ? `أنت مساعد تحقق إعلامي. حلّل النص بحذر. لا تدّعِ أنك تحققت من الإنترنت أو من مصادر لم تفتحها. استخرج الادعاءات القابلة للتحقق، والأدلة المطلوبة، وما لا يمكن الجزم به. لا تصنّف الخبر صحيحاً أو كاذباً دون أدلة. اذكر أن الرابط المدخل لم يتم فتحه تلقائياً. أجب بالعربية بعناوين: ملخص، الادعاءات، مؤشرات الموثوقية، ما يحتاج تحققاً، الحكم المبدئي.\\nالمصدر: ${source||"غير محدد"}\\nالنص:\\n${text}`
      : `قيّم المحتوى من حيث الفائدة والوضوح والعمق وملاءمته لاهتمامات المستخدم. لا تعطِ نسبة مئوية زائفة. اذكر نقاط القوة والقصور ولمن قد يكون مفيداً. أجب بالعربية.\\nالاهتمامات: ${interests||"غير محددة"}\\nالمحتوى:\\n${text}`;
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2}})});
    const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||"خطأ من Gemini"});
    const result=d.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\\n").trim();
    if(!result)return res.status(502).json({error:"لم يرجع Gemini نتيجة نصية"});
    res.json({result});
  }catch(e){res.status(500).json({error:"حدث خطأ داخلي أثناء التحليل"});}
});
const port=process.env.PORT||3000;app.listen(port,()=>console.log(`SEARCH يعمل على http://localhost:${port}`));