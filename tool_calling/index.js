import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

export async function callGroq() {
    const completions = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [ 
            {
                role: "system",
                content: "You are a helpful assistant."
            },  
            {
                role: "user",
                content: "when was iphone 17 released?"
            }
        ]
    })
    console.log(completions.choices[0].message.content)
}
callGroq();
