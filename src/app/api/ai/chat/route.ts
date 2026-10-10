import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: Request) {
  try {
    const { messages, message } = await req.json();

    const userMessage = message || (messages && messages[messages.length - 1]?.content) || "";
    if (!userMessage.trim()) {
      return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
    }

    // Connect to DB and fetch active catalog summary
    await connectDB();
    const products = await Product.find({ isArchived: { $ne: true } })
      .select("title price category stock description slug")
      .limit(20)
      .lean();

    const catalogSummary = products
      .map(
        (p) =>
          `- ${p.title} (${p.category}): ৳${p.price} [Stock: ${p.stock > 0 ? `${p.stock} available` : "Out of stock"}]`
      )
      .join("\n");

    const systemPrompt = `You are NovaAI, a polite, intelligent, and super-helpful Customer Support AI Agent for NovaStore e-commerce platform.
Your goals:
1. Help customers find products, compare prices, answer store policies, shipping/delivery times, and payment methods.
2. Respond in the same language the customer uses (Bengali if they ask in Bengali, English if in English).
3. Be friendly, concise, formatting your answers with bullet points or bold text where appropriate.

Store Context:
- Store Name: NovaStore
- Payment Methods: Cash on Delivery (COD), Online Card, Mobile Banking (bKash/Nagad).
- Delivery Time: 1-2 days within Dhaka, 2-4 days outside Dhaka across Bangladesh.
- Delivery Fee: ৳60 inside Dhaka, ৳120 outside Dhaka. (Free shipping on orders over ৳2000).
- Return Policy: 7-day hassle-free replacement for defective or wrong items.

Current Live Catalog (Active Products in Stock):
${catalogSummary || "No products currently listed."}
`;

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key exists, call Google Gemini 1.5 / 2.0 Flash REST API
    if (apiKey) {
      try {
        const contents = [];

        // Add previous conversation history if provided
        if (Array.isArray(messages) && messages.length > 1) {
          for (const msg of messages.slice(-6, -1)) {
            contents.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }],
            });
          }
        }

        // Add current user prompt
        contents.push({
          role: "user",
          parts: [{ text: userMessage }],
        });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: contents,
              generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            return NextResponse.json({
              reply: replyText,
              source: "gemini",
            });
          }
        }
      } catch (geminiErr) {
        console.error("Gemini API call failed, using fallback:", geminiErr);
      }
    }

    // Smart Catalog & Policy Fallback AI Response Generator
    const lower = userMessage.toLowerCase();
    let reply = "";

    // 1. Bengali Greetings & Help
    if (lower.includes("ki khobor") || lower.includes("kemne") || lower.includes("kemon") || lower.includes("kemn") || lower.includes("assalamu") || lower.includes("salam") || lower.includes("hello") || lower.includes("hi")) {
      reply = "হ্যালো! 👋 NovaStore এ আপনাকে স্বাগতম! আমি আপনার AI অ্যাসিস্ট্যান্ট। যেকোনো প্রোডাক্টের দাম, ডেলিভারি বা স্টক জানতে আমাকে জিজ্ঞেস করতে পারেন!";
    }
    // 2. Product Search & Catalog Lookup
    else if (lower.includes("product") || lower.includes("প্রোডাক্ট") || lower.includes("দাম") || lower.includes("price") || lower.includes("stock") || lower.includes("buy")) {
      const matched = products.filter((p: any) =>
        lower.split(" ").some((term: string) => term.length > 2 && (p.title.toLowerCase().includes(term) || String(p.category || "").toLowerCase().includes(term)))
      );

      if (matched.length > 0) {
        reply = `আমাদের শপে আপনি এই প্রোডাক্টগুলো পাবেন:\n\n` +
          matched.map((p) => `• **${p.title}** - ৳${p.price} (${p.stock > 0 ? `ইন স্টক: ${p.stock}টি` : "স্টক আউট"})`).join("\n") +
          `\n\nআপনি সাইটের Products পেজ থেকে সরাসরি অর্ডার করতে পারেন!`;
      } else {
        reply = `আমাদের স্টোরের লেটেস্ট প্রোডাক্টসমূহ:\n\n` +
          products.slice(0, 5).map((p) => `• **${p.title}** (৳${p.price})`).join("\n") +
          `\n\nবিস্তারিত জানতে উপরে সার্চবার ব্যবহার করুন!`;
      }
    }
    // 3. Delivery & Shipping
    else if (lower.includes("delivery") || lower.includes("ship") || lower.includes("ডেলিভারি") || lower.includes("চার্জ") || lower.includes("time") || lower.includes("কত দিন")) {
      reply = "🚚 **ডেলিভারি সংক্রান্ত তথ্য:**\n• ঢাকার ভেতরে: ১-২ দিনের মধ্যে (ডেলিভারি চার্জ ৳৬০)\n• ঢাকার বাইরে: ২-৪ দিনের মধ্যে (ডেলিভারি চার্জ ৳১২০)\n• ৳২০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি!";
    }
    // 4. Payment
    else if (lower.includes("payment") || lower.includes("bkash") || lower.includes("nagad") || lower.includes("cod") || lower.includes("টাকা") || lower.includes("পেমেন্ট")) {
      reply = "💳 **পেমেন্ট অপশনসমূহ:**\n• ক্যাশ অন ডেলিভারি (Cash on Delivery)\n• বিকাশ / নগদ (Mobile Banking)\n• ডেবিট/ক্রেডিট কার্ড";
    }
    // 5. Order Tracking / Cancel
    else if (lower.includes("order") || lower.includes("track") || lower.includes("অর্ডার") || lower.includes("cancel")) {
      reply = "📦 আপনি আপনার অর্ডারের বর্তমান অবস্থা জানতে এবং ট্র্যাক করতে উপরে **My Orders** বা **Dashboard** ট্যাবে যান। সেখানে লাইভ ট্র্যাকিং দেখতে পাবেন!";
    }
    // General Default
    else {
      reply = `আমি NovaStore এর AI সাপোর্ট অ্যাসিস্ট্যান্ট 🤖। আপনি যেকোনো প্রোডাক্টের দাম, স্টক, ডেলিভারি সময়সূচী বা পেমেন্ট নিয়ে জিজ্ঞেস করতে পারেন।\n\nআমাদের স্টোরের জনপ্রিয় কয়েকটি প্রোডাক্ট:\n` +
        products.slice(0, 3).map((p) => `• **${p.title}**: ৳${p.price}`).join("\n");
    }

    return NextResponse.json({
      reply,
      source: "fallback",
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { reply: "Sorry, I am having trouble processing your request right now. Please try again!" },
      { status: 500 }
    );
  }
}
